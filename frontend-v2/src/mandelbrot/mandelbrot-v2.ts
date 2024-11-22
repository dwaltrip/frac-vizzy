import { WorkerManager, JobRelay } from '@/lib/backburner/worker-manager';
import { BasicCache } from '@/lib/basic-cache';
import { Queue } from '@/lib/queue';
// import { throttle } from '@/lib/throttle';

import { TileID, TileParams, TileResult } from '@/mandelbrot/types';

import {
  FrozenRenderParams,
  RenderParams,
} from '@/mandelbrot/params/render-params';
import { InteractionManager } from '@/mandelbrot/interactions/interaction-manager';
import { TILE_SIZE_IN_PX } from '@/mandelbrot/zoom';
import { RenderJob } from '@/mandelbrot/params/render-job';
import { getTileId } from '@/mandelbrot/tile-id';

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
    baseTileSizePx: TILE_SIZE_IN_PX,
    view: CONTAINER_SIZE,
  });
}

class Mandelbrot {
  canvas: HTMLCanvasElement;
  container: HTMLElement;

  lastRender: RenderJob | null = null;
  pendingRender: RenderJob | null = null;

  private cache = new BasicCache<TileResult>();
  private workQueue = new Queue<TileParams>();
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
      this.onTileResultComputed,
      new JobRelay(
        () => !this.workQueue.isEmpty,
        () => {
          const tile = this.workQueue.dequeue();
          return tile ? [tile] : null;
        },
      ),
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

  getCurrentParams(): FrozenRenderParams {
    if (!this.lastRender) {
      return getDefaultParams();
    }
    return this.pendingRender
      ? this.pendingRender.params
      : this.lastRender.params;
  }

  queueRender(job: RenderJob) {
    if (this.pendingRender) {
      this.pendingRender.cancel();
    }

    this.pendingRender = job;
    this.workQueue.replaceWith(job.targetTiles);
    this.workerManager.startWorking();
  }

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
      const getTile = (tileId: TileID) => {
        return this.cache.has(tileId) ? this.cache.get(tileId) : null;
      };

      try {
        await this.pendingRender.render(getTile);
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

  onTileResultComputed = (result: TileResult) => {
    this.cache.set(getTileId(result.params), result);
  };
}

export { Mandelbrot };
