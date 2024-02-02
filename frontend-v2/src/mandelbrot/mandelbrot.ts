// import { Backburner } from '@/lib/backburner';
import { WorkerManager, JobRelay } from '@/lib/backburner/worker-manager';
import { BasicCache } from '@/lib/basic-cache';
import { Queue } from '@/lib/queue';

import {
  FrozenRenderParams,
  TileCoord,
  TileID,
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
const ITER_LIMIT = 50;

// TODO: this should be dynamically determined and updated on window resize
const CONTAINER_SIZE = { width: 800, height: 700 };

const BROKEN_ZOOM_EXAMPLE: {
  mousePos: { x: number; y: number };
  params: FrozenRenderParams;
  zoomChanges: number[];
} = {
  mousePos: { x: 387, y: 480 },
  params: {
    zoom: 4.7682,
    center: { re: -0.5551, im: -0.5507 },
    defaultTileSizePx: TILE_SIZE_IN_PX,
  },
  zoomChanges: [-0.02, -0.02],
};

class Mandelbrot {
  canvas: HTMLCanvasElement;
  container: HTMLElement;

  private paramsManager: ParamsManager;
  private targetTiles: TileParams[] | null = null;
  private renderedTileIds: Set<TileID> = new Set();

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

    this.paramsManager = new ParamsManager(BROKEN_ZOOM_EXAMPLE.params);
    // console.log('-- init -- hasNewParams', this.paramsManager.hasNewParams);
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
      // TODO: rename / rethink, this is more like "interaction manager says to render".
      // It's currently receiving params as an arg, but they are always the targetParams.
      // Which is kludgy. This parent class already has access to the targetParams.
      // this.onParamsUpdate,
      () => this.queueRender(),
    );
  }

  // TODO: iters param will be set by the user later.
  get iters(): number {
    return ITER_LIMIT;
  }

  queueRender() {}

  setup() {
    this.interactionManager.attachEventListeners();
    window.requestAnimationFrame(this.renderLoop);
    this.queueTilesForParams(this.paramsManager.target);
    this.render();

    // this.manualZoomTest();
    this.brokenZoomExample();
  }

  brokenZoomExample() {
    let i = 0;
    let forwards = BROKEN_ZOOM_EXAMPLE.zoomChanges;
    let backwards = BROKEN_ZOOM_EXAMPLE.zoomChanges.slice().reverse();
    let curr = forwards;

    const intervalId = window.setInterval(() => {
      let change = BROKEN_ZOOM_EXAMPLE.zoomChanges[i];
      if (curr === backwards) {
        change *= -1;
      }
      if (i === curr.length - 1) {
        curr = curr === forwards ? backwards : forwards;
        i = 0;
      } else {
        i += 1;
      }
      console.log('======== i:', i, '-- change:', change, '===========');

      this.interactionManager.performZoom(change, BROKEN_ZOOM_EXAMPLE.mousePos);
    }, 200);
  }

  // TODO: why isn't this smooth???
  manualZoomTest() {
    const mousePos = { x: 360, y: 420 };

    const drawDot = () => {
      const ctx = this.canvas.getContext('2d');
      if (!ctx) throw new Error('2D context not available');
      ctx.fillStyle = 'red';
      ctx.fillRect(mousePos.x - 2, mousePos.y - 2, 4, 4);
    };

    let count = 0;
    const intervalId = window.setInterval(() => {
      count += 1;
      if (count > 100) return;
      this.interactionManager.performZoom(0.05, mousePos);
      drawDot();
    }, 50);
    window.setTimeout(() => window.clearInterval(intervalId), 3000);
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
    this.renderedTileIds = new Set();

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
    console.log('-- queueTilesForParams -- start working...');
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
    if (this.targetTiles && this.targetTiles.length > 0) {
      const c = params.center;
      // console.log('render',
      //   ' -- z:', params.zoom.toFixed(5),
      //   ' -- c:', `(re: ${c.re.toFixed(5)}, im: ${c.im.toFixed(5)})`,
      // )
    }

    console.log('render');
    this.clearCanvas();
    this.targetTiles?.forEach(async (tp) => {
      const key = getTileId(tp);
      // if (this.cache.has(key)) {
      const tile = this.cache.get(key);
      await renderTile(tile, topLeftTileCoord, this.canvas, params, tileSizePx);
      this.renderedTileIds.add(key);
      // }
      // if (!tile) throw new Error('render - Tile not found in cache');
    });
    // await renderTiles(, this.canvas, params, tileSizePx);

    if (this.isDoneComputing) {
      if (this.renderedTileIds.size == this.targetTiles?.length) {
        const areAllTilesRendered =
          this.targetTiles &&
          this.targetTiles.every((tp) => {
            return this.renderedTileIds.has(getTileId(tp));
          });
        if (areAllTilesRendered) {
          console.log(
            '-- target zoom:',
            this.paramsManager.target.zoom.toFixed(4),
          );
          this.paramsManager.commitTarget();
          this.renderedTileIds = new Set();
        }
      }
    }
  }

  get hasDataToRender(): boolean {
    return this.paramsManager.hasNewParams;
  }

  // TODO: This is inefficient... It's probably not a bottleneck though.
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
