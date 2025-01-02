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
} from '@/mandelbrot/types';

import {
  FrozenRenderParams,
  RenderParams,
  RenderParamsUpdate,
} from '@/mandelbrot/params/render-params';
import { InteractionManager } from '@/mandelbrot/interactions/interaction-manager';
import { TILE_SIZE_IN_PX } from '@/mandelbrot/zoom';
import { RenderJob } from '@/mandelbrot/params/render-job';
import { getTileId } from '@/mandelbrot/tile-id';
import { TileStore } from '@/mandelbrot/tile-grid/tile-store';

import {
  buildColorMapper,
  buildHistogramEqualized,
} from '@/mandelbrot/color-mapper';

// TODO: is it possible to use an absolute path?
const WORKER_URL = new URL('./worker.ts', import.meta.url);

// TODO: this should be dynamically determined and updated on window resize
const CONTAINER_SIZE = { width: 800, height: 700 };

function getDefaultParams(): RenderParams {
  return new RenderParams({
    center: { re: 0, im: 0 },
    zoom: 1,
    iters: 100,

    colors: {
      algorithm: 'linear',
      // color1: { r: 255, g: 255, b: 255 },
      // color2: { r: 0, g: 0, b: 0 },
      color1: { r: 255, g: 255, b: 255 },
      color2: { r: 30, g: 0, b: 0 },
    },
    view: CONTAINER_SIZE,

    baseTileSizePx: TILE_SIZE_IN_PX,
  });
}

class Mandelbrot {
  canvas: HTMLCanvasElement;
  container: HTMLElement;

  lastRender: RenderJob | null = null;
  pendingRender: RenderJob | null = null;

  private tileStore = new TileStore();
  private workQueue = new Queue<TileCalcTask>();
  private workerManager: WorkerManager<TileResult>;
  private interactionManager: InteractionManager;

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    numWorkers: number,
  ) {
    this.canvas = canvas;
    this.container = container;

    this.workerManager = new WorkerManager(
      WORKER_URL,
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

  getCurrentParams(): FrozenRenderParams {
    if (!this.lastRender) {
      return getDefaultParams();
    }
    return this.pendingRender
      ? this.pendingRender.params
      : this.lastRender.params;
  }

  private afterRender = debounce(() => {
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
        const [calcStatus, result] = this.tileStore.get(tileId);
        return result?.data as TileData;
      });

      const {
        iters,
        colors: { color1, color2 },
      } = this.lastRender.params;
      const mapperParams = {
        maxIters: iters,
        colors: { start: color1, end: color2 },
      };
      this.lastRender.render(
        buildHistogramEqualized(tileResults, mapperParams),
      );
      this.lastLastRender = this.lastRender;
    }
  }, 50);

  statusFilter = (status: TileCalcStatus) => {
    return (params: TileParams) =>
      this.tileStore.getStatus(getTileId(params)) == status;
  };

  queueRender(target: FrozenRenderParams) {
    let numBusyWorkers = 0;
    if (this.pendingRender) {
      numBusyWorkers = this.workerManager.busyWorkers.length;
      this.pendingRender.cancel();
    }

    const job = (this.pendingRender = new RenderJob(
      target,
      this.canvas,
      this.tileStore,
      { onCompletion: () => this.afterRender() },
    ));

    const tilesToCompute = job.targetTiles.filter(
      this.statusFilter('not started'),
    );

    // --------------- helpful logging ----------------
    const numInProgress = job.targetTiles.filter(
      this.statusFilter('in progress'),
    ).length;
    const logInfo = [
      `tiles to compute: ${tilesToCompute.length}`,
      `tiles in progress: ${numInProgress}`,
      ...(numBusyWorkers > 0 ? [`workers busy: ${numBusyWorkers}`] : []),
    ];
    console.log(`\tqueuing render job -- (${logInfo.join(' | ')})`);
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

  // TODO: is there a reason for this to exist? can we just use the constructor?
  setup() {
    this.interactionManager.attachEventListeners();

    window.requestAnimationFrame(this.renderLoop);
    this.queueRender(getDefaultParams());

    // --------------------------------------------------------
    // TODO: where should this go
    window.addEventListener('resize', this.handleWindowResize);
    this.handleWindowResize();
    // --------------------------------------------------------
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
    // const rect = this.container.getBoundingClientRect();
    // const newView = { width: rect.width, height: rect.height };
    const newView = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
    const target = { ...this.getCurrentParams(), view: newView };

    this.queueRender(target);
    this.canvas.width = newView.width;
    this.canvas.height = newView.height;
  };
  private handleWindowResize = this._handleWindowResize;
  // private handleWindowResize = throttle(this._handleWindowResize, 30);

  onTileResultComputed = (task: TileCalcTask, result: TileResult) => {
    const tileId = getTileId(task.params);
    this.tileStore.cacheResult(tileId, result);
  };
}

export { Mandelbrot };
