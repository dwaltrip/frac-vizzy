import { debounce } from '@/lib/debounce';
import { WorkerManager, TaskRelay } from '@/lib/backburner/worker-manager';
import { Queue } from '@/lib/queue';
// import { throttle } from '@/lib/throttle';

import {
  TileCalcTask,
  TileResult,
  TileCalcStatus,
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

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    // TODO: this is a mess
    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    if (
      this.lastRender &&
      !this.pendingRender &&
      this.lastRender !== this.lastLastRender
    ) {
      const tileResults = this.lastRender.targetTiles.map((tc) => {
        const tileId = getTileId(tc);
        const [_, result] = this.tileStore.get(tileId);
        return result?.data as TileData;
      });

      const {
        iters,
        colors: { algorithm, color1, color2 },
      } = this.lastRender.params;
      if (algorithm === 'histogram') {
        const mapperParams = {
          maxIters: iters,
          colors: { start: color1, end: color2 },
        };
        this.lastRender.render(
          buildGetColorUsingHistogram(tileResults, mapperParams),
          // buildHistogramEqualized(tileResults, mapperParams),
        );
        this.lastLastRender = this.lastRender;
      }
    }
  };

  private afterRender = debounce(this._afterRender, 50);

  statusFilter = (status: TileCalcStatus) => {
    return (params: TileParams) =>
      this.tileStore.getStatus(getTileId(params)) == status;
  };

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

    const view = this.getViewport();
    // TODO: create a `normalizeParams` function that does this stuff.
    const target = {
      ...rawTarget,
      center: trimCenterCoords(rawTarget.center, rawTarget.zoom, view),
      // NOTE: we tried to implement a `trimZoom` with Claude, but it wasn't working.
      // There were major jitters when zooming. So for now I'm just not trimming.
      zoom: rawTarget.zoom,
    };

    const job = (this.pendingRender = new RenderJob(
      target,
      this.canvas,
      this.tileStore,
      { onCompletion: () => this.afterRender() },
    ));
    // call hook with new params
    // we use this to update the URL to reflect the new render params
    this.onNewParams && this.onNewParams(job.params, isDefault);

    const tilesToCompute = job.targetTiles.filter(
      this.statusFilter('not started'),
    );

    // --------------- helpful logging ----------------
    console.log(
      `-- New render job (${job.id}) -- # of target tiles:`,
      job.targetTiles.length,
      '-- # of tiles to compute:',
      tilesToCompute.length,
    );
    // ---------------

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
        // TODO: don't do this every frame, can do once per render job
        const getColor = this.buildColorMapperForParams(
          this.pendingRender.params,
        );
        await this.pendingRender.render(getColor);
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
