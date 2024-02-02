import { WorkerManager, JobRelay } from '@/lib/backburner/worker-manager';
import { BasicCache } from '@/lib/basic-cache';
import { Queue } from '@/lib/queue';

import { TileResult, Viewport } from '@/mandelbrot/types';

import {
  FrozenRenderParams,
  RenderParams,
} from '@/mandelbrot/params/render-params';
import { InteractionManager } from '@/mandelbrot/interactions/interaction-manager';
import { TILE_SIZE_IN_PX } from '@/mandelbrot/zoom';
import { calculateVisibleTilesUsingUpscaling } from '@/mandelbrot/tile';
import { renderTile } from '@/mandelbrot/render-tile';
import { RenderJob } from '@/mandelbrot/params/render-job';
import { R } from 'vitest/dist/reporters-1evA5lom.js';

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
  }

  setup() {
    this.resizeCanvas(CONTAINER_SIZE);
    this.interactionManager.attachEventListeners();
    this.pendingRender = new RenderJob(getDefaultParams());

    window.requestAnimationFrame(this.renderLoop);
  }

  private renderLoop = async () => {
    if (this.pendingRender) {
      try {
        await this.pendingRender.render();
      } catch (e) {
        console.error('--- Mandelbrot.renderLoop: error rendering ---');
        console.error(e);
      }
      this.lastRender = this.pendingRender;
      this.pendingRender = null;
    }
    window.requestAnimationFrame(this.renderLoop);
  };

  private resizeCanvas(size: Viewport) {
    this.container.style.width = `${size.width}px`;
    this.container.style.height = `${size.height}px`;
    this.canvas.width = size.width;
    this.canvas.height = size.height;
  }
}

export { Mandelbrot };
