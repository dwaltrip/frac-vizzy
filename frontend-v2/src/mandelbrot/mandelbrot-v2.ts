import { WorkerManager, JobRelay } from '@/lib/backburner/worker-manager';
import { BasicCache } from '@/lib/basic-cache';
import { Queue } from '@/lib/queue';

import { TileID, TileParams, TileResult, Viewport } from '@/mandelbrot/types';

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
    tileSizePx: TILE_SIZE_IN_PX,
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
      () => this.getRenderedParams(),
      (job: RenderJob) => this.queueRender(job),
    );
  }

  // TODO: iters param will be set by the user later.
  get iters(): number {
    return ITER_LIMIT;
  }

  getRenderedParams(): FrozenRenderParams {
    if (!this.lastRender) {
      return getDefaultParams();
    }
    return this.lastRender.params;
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
    this.resizeCanvas(CONTAINER_SIZE);
    this.interactionManager.attachEventListeners();

    window.requestAnimationFrame(this.renderLoop);
    this.queueRender(new RenderJob(getDefaultParams(), this.canvas));
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

      const t0 = performance.now();
      try {
        await this.pendingRender.render(getTile);
      } catch (e) {
        console.error('--- Mandelbrot.renderLoop: error rendering ---');
        console.error(e);
      }
      console.log(
        `-- renderLoop (job = ${this.pendingRender.id}) --`,
        'render time:',
        (performance.now() - t0).toFixed(2),
        'ms',
      );

      if (this.pendingRender.isComplete) {
        this.lastRender = this.pendingRender;
        this.pendingRender = null;
      }
    }

    window.requestAnimationFrame(this.renderLoop);
  };

  private resizeCanvas(size: Viewport) {
    this.container.style.width = `${size.width}px`;
    this.container.style.height = `${size.height}px`;
    this.canvas.width = size.width;
    this.canvas.height = size.height;
  }

  onTileResultComputed = (result: TileResult) => {
    this.cache.set(getTileId(result.params), result);
  };
}

export { Mandelbrot };
