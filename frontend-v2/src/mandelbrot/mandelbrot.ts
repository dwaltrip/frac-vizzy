// import { Backburner } from '@/lib/backburner';
import { WorkerManager, JobRelay } from '@/lib/backburner/worker-manager';
import { BasicCache } from '@/lib/basic-cache';
import { Queue } from '@/lib/queue';

import {
  FrozenRenderParams,
  TileCoord,
  TileParams,
  TileResult,
  Viewport,
} from '@/mandelbrot/types';

import { getTileGridRect } from '@/mandelbrot/tile';
import { getTileId } from '@/mandelbrot/tile-id';

import { ParamsManager } from '@/mandelbrot/params-manager';
import { InteractionManager } from '@/mandelbrot/interactions/interaction-manager';
import { TILE_SIZE_IN_PX } from '@/mandelbrot/zoom';
import { calculateVisibleTilesUsingUpscaling } from '@/mandelbrot/tile';
import { renderTile } from '@/mandelbrot/render-tile';

/*
  ## setup 
    - setup canvas and event listeners
    - setup tile cache
    - setup tilesToCompute queue
    - setup background workers so they are ready to do work, and constantly checking
      - QUESTION: how do the workers check for new work?

  ## event flow
    1. user does something
    2. target params change (now different from curr params)
    3. determine which tiles are needed for these params + viewport ("targetTiles" ?)
    4. check which of the targetTiles we don't have cached
    5. add missing targetTiles to "tilesToCompute" queue / data structure
    6. wor
*/

// TODO: is it possible to use an absolute path?
const WORKER_URL = new URL('./worker.ts', import.meta.url);

// TODO: this will be set by the user
const ITER_LIMIT = 100;

// TODO: this should be dynamically determined and updated on window resize
const CONTAINER_SIZE = { width: 1000, height: 700 };

class Mandelbrot {
  canvas: HTMLCanvasElement;
  container: HTMLElement;

  private paramsManager: ParamsManager;
  private targetTiles: TileParams[] | null = null;

  // TODO: I think ideally these queues would be priority queues
  // There's a bunch of stuff we could do with determining priority of a tile
  private workQueue: Queue<TileParams>;
  // private renderQueue: Queue<TileResult>;
  private cache = new BasicCache<TileResult>();

  private workerManager: WorkerManager<TileResult>;
  private interactionManager: InteractionManager;
  // private backburner: Backburner;
  // private backburner: Backburner<TileParams, TileResult>;

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    numWorkers: number,
  ) {
    this.canvas = canvas;
    this.container = container;
    this.sizeCanvas();

    this.workQueue = new Queue<TileParams>();
    // this.renderQueue = new Queue<TileResult>();

    this.paramsManager = new ParamsManager();
    console.log('-- init -- hasNewParams', this.paramsManager.hasNewParams);
    // this.backburner = new Backburner(new BasicCache<TileResult>(), numWorkers);
    // this.backburner = new Backburner(numWorkers);
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
      this.paramsManager,
      this.onParamsUpdate,
    );
  }

  // TODO: iters param will be set by the user later.
  get iters(): number {
    return ITER_LIMIT;
  }

  setup() {
    this.interactionManager.attachEventListeners();
    window.requestAnimationFrame(this.renderLoop);
    this.queueTilesForParams(this.paramsManager.target);
    this.render();
  }

  cleanup() {
    this.interactionManager.detachEventListeners();
  }

  private onParamsUpdate = (targetParams: FrozenRenderParams) => {
    this.queueTilesForParams(targetParams);
  };

  private queueTilesForParams = (params: FrozenRenderParams) => {
    // get target tiles
    this.targetTiles = calculateVisibleTilesUsingUpscaling(
      params,
      this.view,
    ).map(this.coordToTileParam);

    // check cache
    const cachedTileResults = this.targetTiles
      .map((tp) => {
        const id = getTileId(tp);
        return this.cache.has(id) ? this.cache.get(id) : null;
      })
      .filter((res) => res !== null) as TileResult[];

    const uncachedTileParams = this.targetTiles.filter(
      (tp) => !this.cache.has(getTileId(tp)),
    );

    // this.renderQueue.enqueueAll(cachedTileResults);
    // this.workQueue.enqueueAll(uncachedTileParams);
    this.workQueue.replaceWith(uncachedTileParams);
    // this.clearCanvas();

    // assign work to workers
    this.workerManager.startWorking();
  };

  onTileResultComputed = (result: TileResult) => {
    const c = result.params.coord;
    const cStr = `(${c.x},${c.y},${c.z})`;
    // console.log('Tile result computed -- ', cStr);
    this.cache.set(getTileId(result.params), result);
    // this.renderQueue.enqueue(result);
  };

  // getNextTileToCompute = (): TileParams | null => {
  //   return this.workQueue.dequeue() || null;
  // };

  private renderLoop = async () => {
    // if (this.hasNewTilesToRender()) {
    if (this.hasDataToRender) {
      console.log('rendering..');
      await this.render();
    }
    window.requestAnimationFrame(this.renderLoop);
  };

  private clearCanvas() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private async render() {
    // const params = this.paramsManager.current;
    const params = this.paramsManager.target;
    const tileSizePx = TILE_SIZE_IN_PX;

    const tileGridRect = getTileGridRect(params, this.view);
    const topLeftTileCoord = tileGridRect.topLeft;
    // const topLeftTileCoord = getTopLeftTile(this.view, params);

    // while (this.renderQueue.length > 0) {
    //   const tile = this.renderQueue.dequeue()!;
    //   await renderTile(tile, topLeftTileCoord, this.canvas, params, tileSizePx);
    // }

    if (!this.isDoneComputing) {
      return;
    }

    this.clearCanvas();
    this.targetTiles?.forEach(async (tp) => {
      const key = getTileId(tp);
      if (this.cache.has(key)) {
        const tile = this.cache.get(getTileId(tp))!;
        await renderTile(
          tile,
          topLeftTileCoord,
          this.canvas,
          params,
          tileSizePx,
        );
      }
      // if (!tile) throw new Error('render - Tile not found in cache');
    });
    // await renderTiles(, this.canvas, params, tileSizePx);

    if (this.isDoneComputing) {
      this.paramsManager.commitTarget();
    }
  }

  get hasDataToRender(): boolean {
    return this.paramsManager.hasNewParams;
  }

  get isDoneComputing(): boolean {
    return (
      !!this.targetTiles &&
      this.targetTiles.every((tp) => {
        return this.cache.has(getTileId(tp));
      })
    );
  }

  // TODO: will this work after a resize?
  get view(): Viewport {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  coordToTileParam = (coord: TileCoord): TileParams => ({
    coord,
    iters: this.iters,
  });

  private sizeCanvas() {
    this.container.style.width = `${CONTAINER_SIZE.width}px`;
    this.container.style.height = `${CONTAINER_SIZE.height}px`;
    this.canvas.width = CONTAINER_SIZE.width;
    this.canvas.height = CONTAINER_SIZE.height;
  }
}

export { Mandelbrot };
