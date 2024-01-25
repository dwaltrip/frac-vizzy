// import { Backburner } from '@/lib/backburner';
import { WorkerManager } from '@/lib/backburner/worker-manager';
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
import { getTilesForParams } from '@/mandelbrot/get-tiles-for-params';
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

const WORKER_SCRIPT = '@/mandlebrot/worker.ts';

// TODO: this will be set by the user
const ITER_LIMIT = 100;

// TODO: this should be dynamically determined and updated on window resize
const CONTAINER_SIZE = { width: 1000, height: 700 };

class Mandelbrot {
  canvas: HTMLCanvasElement;
  container: HTMLElement;

  private paramsManager: ParamsManager;

  private workQueue: Queue<TileParams>;
  private renderQueue: Queue<TileResult>;
  private cache = new BasicCache<TileResult>();

  private workerManager: WorkerManager;
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
    this.renderQueue = new Queue<TileResult>();

    this.paramsManager = new ParamsManager();
    // this.backburner = new Backburner(new BasicCache<TileResult>(), numWorkers);
    // this.backburner = new Backburner(numWorkers);
    this.workerManager = new WorkerManager(
      WORKER_SCRIPT,
      numWorkers,
      this.onTileResultComputed,
      this.getNextTileToCompute,
    );

    this.interactionManager = new InteractionManager(
      canvas,
      this.paramsManager,
      this.onParamsUpdate,
    );
  }

  setup() {
    this.interactionManager.attachEventListeners();
    window.requestAnimationFrame(this.renderLoop);
  }

  cleanup() {
    this.interactionManager.detachEventListeners();
  }

  onParamsUpdate = (targetParams: FrozenRenderParams) => {
    // const iters = targetParams.iters;
    const iters = ITER_LIMIT;

    const coordToTileParam = (coord: TileCoord): TileParams => ({
      coord,
      iters,
    });

    // get target tiles
    const targetTiles: TileParams[] = getTilesForParams(
      targetParams,
      this.view,
      TILE_SIZE_IN_PX,
    ).map(coordToTileParam);

    // check cache
    const cachedTileResults = targetTiles
      .map((tp) => {
        const id = getTileId(tp);
        return this.cache.has(id) ? this.cache.get(id) : null;
      })
      .filter((res) => res !== null) as TileResult[];

    const uncachedTileParams = targetTiles.filter(
      (tp) => !this.cache.has(getTileId(tp)),
    );

    this.renderQueue.enqueueAll(cachedTileResults);
    this.workQueue.enqueueAll(uncachedTileParams);

    // assign work to workers
    this.workerManager.startWorking();
  };

  onTileResultComputed = (result: TileResult) => {
    this.renderQueue.enqueue(result);
  };

  getNextTileToCompute = (): TileParams | null => {
    return this.workQueue.dequeue() || null;
  };

  private renderLoop = async () => {
    // if (this.hasNewTilesToRender()) {
    if (this.hasDataToRender) {
      await this.render();
    }
    window.requestAnimationFrame(this.renderLoop);
  };

  private async render() {
    const params = this.paramsManager.current;
    const tileSizePx = TILE_SIZE_IN_PX;

    con;
    const tileGridRect = getTileGridRect(this.view, params.center, tileSizePx);
    const topLeftTileCoord = getTopLeftTile(this.view, params);

    while (this.renderQueue.length > 0) {
      const tile = this.renderQueue.dequeue()!;
      await renderTile(tile, topLeftTileCoord, this.canvas, params, tileSizePx);
    }
    // await renderTiles(, this.canvas, params, tileSizePx);

    this.paramsManager.commitTarget();
  }

  getTopLeftTile(params: FrozenRenderParams): TileCoord {
    const view = this.view;
    const region = {
      topLeft: params.center,
      bottomRight: params.center,
    };
    return {
      x: Math.floor(region.topLeft.re / TILE_SIZE_IN_PX),
      y: Math.floor(region.topLeft.im / TILE_SIZE_IN_PX),
    };
  }

  get hasDataToRender() {
    return this.renderQueue.length > 0;
  }

  // TODO: will this work after a resize?
  get view(): Viewport {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  private sizeCanvas() {
    this.container.style.width = `${CONTAINER_SIZE.width}px`;
    this.container.style.height = `${CONTAINER_SIZE.height}px`;
    this.canvas.width = CONTAINER_SIZE.width;
    this.canvas.height = CONTAINER_SIZE.height;
  }
}

export { Mandelbrot };
