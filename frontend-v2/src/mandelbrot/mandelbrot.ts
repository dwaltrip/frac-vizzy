import { debounce } from '@/lib/debounce';
import { WorkerManager, TaskRelay } from '@/lib/backburner/worker-manager';
import { Queue } from '@/lib/queue';
import { invariant } from '@/utils/invariant';
// import { throttle } from '@/lib/throttle';

import {
  TileCalcTask,
  TileResult,
  TileParams,
  ColorMapper,
  TileData,
  Viewport,
} from '@/mandelbrot/types';

import {
  FrozenRenderParams,
  getInitialParams,
  RenderParams,
  RenderParamsData,
  RenderParamsUpdate,
  trimCenterCoords,
} from '@/mandelbrot/params/render-params';
import { InteractionManager } from '@/mandelbrot/interactions/interaction-manager';
import { TILE_SIZE_IN_PX } from '@/mandelbrot/zoom';
import { RenderJob } from '@/mandelbrot/params/render-job';
import {
  calculateVisibleTilesUsingUpscaling,
  computeTilePointsConditionally,
} from '@/mandelbrot/tile';
import { getTileId } from '@/mandelbrot/tile-id';
import { TileStore } from '@/mandelbrot/tile-grid/tile-store';

import {
  buildColorMapper,
  // buildHistogramEqualized,
} from '@/mandelbrot/color-mapper';
import { buildGetColorUsingHistogram } from '@/mandelbrot/viz/histogram';

type ParamsChangeListener = (
  params: RenderParamsData,
  isInitialRender: boolean,
) => void;

class Mandelbrot {
  canvas: HTMLCanvasElement;
  container: HTMLElement;

  lastRender: RenderJob | null = null;
  pendingRender: RenderJob | null = null;
  // TODO: fix this hack.
  lastLastRender: RenderJob | null = null;

  private tileStore = new TileStore();
  private workQueue = new Queue<TileCalcTask>();
  private workerManager: WorkerManager<TileResult>;
  private interactionManager: InteractionManager;
  private onNewParams: ParamsChangeListener;

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    numWorkers: number,
    onNewParams: ParamsChangeListener,
  ) {
    this.canvas = canvas;
    this.container = container;
    this.onNewParams = onNewParams;

    this.workerManager = new WorkerManager(
      () => {
        // -------------------------------------------------------------------------
        // NOTE: This has to be a string literal passed directly to URL constructor,
        // which is passed directly to the Worker constructor.
        // Vite uses a regex to figure out how to build the worker script,
        // so we can't pass a variable to the URL constructor.
        // The docs don't mention this...
        // I was clued off by this github issue which mentioned a regex used in preactjs
        // for their worker plugin.
        // https://github.com/vitejs/vite/discussions/18932
        // https://github.com/preactjs/wmr/blob/a3d8935d5c5f99f5cd9b3a5ad435ee9f063cf5ad/packages/wmr/src/plugins/worker-plugin.js#L88-L89
        // -------------------------------------------------------------------------
        return new Worker(new URL('./worker.ts', import.meta.url), {
          type: 'module',
        });
      },
      numWorkers,
      new TaskRelay(
        () => !this.workQueue.isEmpty,
        () => {
          const task = this.workQueue.dequeue();
          return task || null;
        },
      ),
      {
        beforeTask: (task: TileCalcTask) => {
          const tileId = getTileId(task.params);
          this.tileStore.setAsInProgress(tileId, task.params);
        },
        afterTask: this.onTileResultComputed,
      },
    );

    this.interactionManager = new InteractionManager(
      canvas,
      () => this.getCurrentParams(),
      (target) => this.queueRender(target),
    );
    this.interactionManager.attachEventListeners();
    window.addEventListener('resize', this.handleWindowResize);

    // TODO: initial zoom based should be basd on screen size / viewport size
    const view = this.resizeCanvasToContainer();
    const [initialParams, isDefault] = getInitialParams(view);

    window.requestAnimationFrame(this.renderLoop);

    // first render
    const target = {
      ...initialParams,
      view,
      baseTileSizePx: TILE_SIZE_IN_PX,
    };
    this.queueRender(target, isDefault);
  }

  updateParams(update: RenderParamsUpdate) {
    const current = this.getCurrentParams();
    const target = new RenderParams(current).clone();

    switch (update.type) {
      case 'center':
        target.center = update.value;
        break;
      case 'zoom':
        target.zoom = update.value;
        break;
      case 'iters':
        target.iters = update.value;
        break;
      case 'colors':
        target.colors = { ...current.colors, ...update.value };
        break;
      case 'view':
        target.view = update.value;
        break;
    }
    this.queueRender(target);
  }

  containerDims(): Viewport {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
  }

  getCurrentParams(): FrozenRenderParams {
    if (!this.pendingRender && !this.lastRender) {
      throw new Error('Invalid state: never rendered');
    }
    return this.pendingRender
      ? this.pendingRender.params
      : this.lastRender!.params;
  }

  private _afterRender = () => {
    console.log(
      '##~~ After render ~~##',
      'last render:',
      this.lastRender?.id,
      '-- pending render:',
      this.pendingRender?.id,
    );
  };
  private afterRender = debounce(this._afterRender, 50);

  getViewport(): Viewport {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  queueRender(rawTarget: FrozenRenderParams, isDefault = false) {
    if (this.pendingRender) {
      this.pendingRender.cancel();
    }

    const target = this.normalizeParams(rawTarget);
    const targetTiles = calculateVisibleTilesUsingUpscaling(
      target,
      target.view,
    );

    const { color1, color2 } = target.colors;
    const mapperParams = {
      maxIters: target.iters,
      colors: { start: color1, end: color2 },
    };
    const colorMapper =
      target.colors.algorithm === 'linear'
        ? buildColorMapper(mapperParams)
        : {
            during: this.createInProgressHistogramColorMapper(
              target,
              targetTiles,
            ),
            buildGetColorOnCompletion: (tilesData: TileData[]) => {
              return buildGetColorUsingHistogram(tilesData, mapperParams);
            },
          };

    const job = (this.pendingRender = new RenderJob(
      target,
      targetTiles,
      this.tileStore,
      this.canvas,
      colorMapper,
      { onCompletion: () => this.afterRender() },
    ));

    // call hook with new params
    // we use this to update the URL to reflect the new render params
    this.onNewParams && this.onNewParams(job.params, isDefault);

    // Don't recompute tiles.
    // Importantly, this skips tiles currently in progress.
    const tilesToCompute = job.targetTiles.filter(
      (tp) => this.tileStore.getStatus(getTileId(tp)) === 'not started',
    );

    // TODO: the coupling / relationship between `workQueue` and `workerManager`
    // should be more explicit, clear, and clean.
    // They are linked by the "TaskRelay" object that gets passed into `new workerManager`.
    // e.g. mabye we pass in a new "queue" of target tiles?
    this.workQueue.replaceWith(
      tilesToCompute.map((params) => ({
        params,
        context: { renderId: job.id },
      })),
    );
    this.workerManager.startWorking();
  }

  // TODO: Once we have a progress indicator, we can show a messaage
  // for this step saying something like "prepping for render".
  createInProgressHistogramColorMapper(
    params: FrozenRenderParams,
    targetTiles: TileParams[],
  ) {
    const { algorithm, color1, color2 } = params.colors;
    invariant(algorithm === 'histogram', 'Invalid algorithm for histogram');
    const mapperParams = {
      maxIters: params.iters,
      colors: { start: color1, end: color2 },
    };

    // Get random sample of 1% of points
    // TODO: Make this deterministic so the colors don't flicker as you pan around.
    // Hmmm, in frac-vizzy v1 there was flickering. But it seems fine now!
    // May not neeed to worry about this.
    const randomSampleTileResults = targetTiles.map((tile) => {
      return computeTilePointsConditionally(tile, () => {
        return Math.random() < 0.01;
      });
    });

    return buildGetColorUsingHistogram(randomSampleTileResults, mapperParams);
  }

  normalizeParams(params: RenderParamsData): RenderParamsData {
    return {
      ...params,
      center: trimCenterCoords(params.center, params.zoom, params.view),
      // NOTE: we tried to implement a `trimZoom` with Claude, but it wasn't working.
      // There were major jitters when zooming. So for now I'm just not trimming.
      zoom: params.zoom,
    };
  }

  cleanup() {
    this.interactionManager.detachEventListeners();
    // this.workerManager.terminate();
  }

  buildColorMapperForParams(params: FrozenRenderParams): ColorMapper {
    // const { color1, color2, algorithm: _ } = target.colors;
    const { color1, color2 } = params.colors;

    const mapperParams = {
      maxIters: params.iters,
      colors: { start: color1, end: color2 },
    };
    return buildColorMapper(mapperParams);

    // const useHistogram = false;
    // const getColor = (useHistogram ?
    //   buildHistogramEqualized([], colorParams) :
    //   buildColorMapper(colorParams)
    // );
  }

  private renderLoop = async () => {
    if (this.pendingRender) {
      try {
        await this.pendingRender.render();
      } catch (e) {
        console.error('--- Mandelbrot.renderLoop: error rendering ---');
        console.error(e);
      }

      if (this.pendingRender.isComplete) {
        this.lastRender = this.pendingRender;
        this.pendingRender = null;
      }
    }

    window.requestAnimationFrame(this.renderLoop);
  };

  // -----------------------------------------------------------
  // TODO: this feels a little laggy / sluggish.
  // Was the throttle contributing? Other ways to improve?
  // As a reference point, look at how resizing feels without any mandelbrot viz.
  // -----------------------------------------------------------
  // TODO: possibly look into ResizeObserver
  // -----------------------------------------------------------
  private _handleWindowResize = () => {
    const view = this.resizeCanvasToContainer();
    const target = { ...this.getCurrentParams(), view };
    this.queueRender(target);
  };
  private handleWindowResize = this._handleWindowResize;
  // private handleWindowResize = throttle(this._handleWindowResize, 30);

  private resizeCanvasToContainer(): Viewport {
    const view = this.containerDims();
    this.canvas.width = view.width;
    this.canvas.height = view.height;
    return view;
  }

  onTileResultComputed = (task: TileCalcTask, result: TileResult) => {
    const tileId = getTileId(task.params);
    this.tileStore.cacheResult(tileId, result);
  };
}

export { Mandelbrot };
