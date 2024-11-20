import { perfStats } from '@/lib/perf-stats';

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

const BROKEN_PARAMS_EX_1_MISSING_TILES = {
  center: { re: -0.7629357228155087, im: -0.18048391004101227 },
  zoom: 4.857980995127572,
  iters: 50,
  baseTileSizePx: 64,
  view: { width: 800, height: 700 },
};
const BROKEN_PARAMS_EX_2_MISSING_TILES = {
  center: { re: -0.8425942857142862, im: -0.29383605911330063 },
  zoom: 4.857980995127572,
  iters: 50,
  baseTileSizePx: 128,
  view: { width: 800, height: 700 },
};

const BROKEN_PARAMS_EX_2_MISSING_TILES_STATE_B = {
  center: { re: -0.9074218719211844, im: -0.30487054187192164 },
  zoom: 4.857980995127572,
  iters: 50,
  baseTileSizePx: 128,
  view: { width: 800, height: 700 },
};

function getDefaultParams(): RenderParams {
  // return new RenderParams(BROKEN_PARAMS_EX_2_MISSING_TILES);
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

    // @ts-ignore
    window.zzz_getRenderedParams = () => {
      // return this.getCurrentParams();
      return this.lastRender?.params;
    };

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

    // // @ts-ignore
    // window.zzz_jumpToDebugStateA = () => {
    //   this.queueRender(new RenderJob(new RenderParams(BROKEN_PARAMS_EX_2_MISSING_TILES), this.canvas));
    // };
    // // @ts-ignore
    // window.zzz_jumpToDebugStateB = () => {
    //   this.queueRender(new RenderJob(new RenderParams(BROKEN_PARAMS_EX_2_MISSING_TILES_STATE_B), this.canvas));
    // };
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

      // const t0 = performance.now();
      // perfStats.resetStats('render-tile');
      // perfStats.resetStats('points-to-bitmap');
      // perfStats.resetStats('ctx.drawImage');
      try {
        await this.pendingRender.render(getTile);
      } catch (e) {
        console.error('--- Mandelbrot.renderLoop: error rendering ---');
        console.error(e);
      }
      // console.log(`-- renderLoop --`, 'render time:',
      //   (performance.now() - t0).toFixed(2), 'ms');
      // perfStats.logStats('render-tile', '\t');
      // perfStats.logStats('points-to-bitmap', '\t');
      // perfStats.logStats('ctx.drawImage', '\t');

      if (this.pendingRender.isComplete) {
        // console.log('-- render complete -- drawPoints count:', window.zzz_drawCounter.get());
        // console.log('--- render complete ---', 'tile count:', this.pendingRender.targetTiles.length);
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
