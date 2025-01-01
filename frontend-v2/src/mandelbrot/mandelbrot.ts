import { debounce } from '@/lib/debounce';
import { WorkerManager, TaskRelay } from '@/lib/backburner/worker-manager';
import { Queue } from '@/lib/queue';
// import { throttle } from '@/lib/throttle';

import {
  TileID,
  TileCalcTask,
  TileResult,
  TileCalcStatus,
  TileParams,
} from '@/mandelbrot/types';

import {
  FrozenRenderParams,
  RenderParams,
} from '@/mandelbrot/params/render-params';
import { InteractionManager } from '@/mandelbrot/interactions/interaction-manager';
import { TILE_SIZE_IN_PX } from '@/mandelbrot/zoom';
import { RenderJob } from '@/mandelbrot/params/render-job';
import { getTileId } from '@/mandelbrot/tile-id';
import { TileStore } from '@/mandelbrot/tile-grid/tile-store';

// TODO: is it possible to use an absolute path?
const WORKER_URL = new URL('./worker.ts', import.meta.url);

// TODO: this will be set by the user
const ITER_LIMIT = 50;

// TODO: this should be dynamically determined and updated on window resize
const CONTAINER_SIZE = { width: 800, height: 700 };

function getDefaultParams(): RenderParams {
  return new RenderParams({
    center: { re: 0, im: 0 },
    zoom: 1,
    iters: ITER_LIMIT,

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
      (job: RenderJob) => this.queueRender(job),
    );
  }

  // TODO: iters param will be set by the user later.
  get iters(): number {
    return ITER_LIMIT;
  }

  setIterations(iters: number) {
    const target = { ...this.getCurrentParams(), iters };
    this.queueRender(new RenderJob(target, this.canvas));
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
    console.log('##~~ After render ~~##');
  }, 100);

  statusFilter = (status: TileCalcStatus) => {
    return (params: TileParams) =>
      this.tileStore.getStatus(getTileId(params)) == status;
  };

  // TODO: InteractionManager shouldn't craete a new RenderJob,
  // it should just pass the new target params to the Mandelbrot instance
  // and then the Mandelbrot instance should create the new RenderJob.
  // Then we could get rid of the `setOnCompletion` method on RenderJob.
  // And also pass the `tileStore` into the RenderJob constructor.
  queueRender(job: RenderJob) {
    let numBusyWorkers = 0;
    if (this.pendingRender) {
      numBusyWorkers = this.workerManager.busyWorkers.length;
      this.pendingRender.cancel();
    }

    job.setOnCompletion(() => this.afterRender());

    this.pendingRender = job;
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
    this.queueRender(new RenderJob(getDefaultParams(), this.canvas));

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

  private renderLoop = async () => {
    if (this.pendingRender) {
      const getTileResult = (tileId: TileID) => {
        const [calcStatus, result] = this.tileStore.get(tileId);
        return calcStatus == 'complete' ? result : null;
      };

      try {
        await this.pendingRender.render(getTileResult);
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

    this.queueRender(new RenderJob(target, this.canvas));
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
