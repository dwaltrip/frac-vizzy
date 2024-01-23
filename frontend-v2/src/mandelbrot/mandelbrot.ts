// import { Backburner } from '@/lib/backburner';
import { WorkerManager } from '@/lib/backburner/worker-manager';
import { BasicCache } from '@/lib/basic-cache';
import { Queue } from '@/lib/queue';

import {
  FrozenRenderParams,
  SetStatus,
  TileCoord,
  Viewport,
} from '@/mandelbrot/types';

import { ParamsManager } from '@/mandelbrot/params-manager';
import { InteractionManager } from '@/mandelbrot/interactions/interaction-manager';
import { TILE_SIZE_IN_PX } from '@/mandelbrot/zoom';
import { getTilesForParams } from '@/mandelbrot/get-tiles-for-params';

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

// TODO: this should be dynamically determined and updated on window resize
const CONTAINER_SIZE = { width: 1000, height: 700 };

// type TileId = string;

interface TileParams {
  coord: TileCoord;
}

interface TileResult {
  parms: TileParams;
  data: SetStatus[][];
}

class Mandelbrot {
  canvas: HTMLCanvasElement;
  container: HTMLElement;

  private paramsManager: ParamsManager;

  private workQueue: Queue<TileParams>;
  private renderQueue: Queue<TileResult>;
  private cache = new BasicCache<TileResult>();

  // private backburner: Backburner;
  private workerManager: WorkerManager;
  private interactionManager: InteractionManager;
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
    this.workerManager = new WorkerManager(WORKER_SCRIPT, numWorkers);

    this.interactionManager = new InteractionManager(
      canvas,
      this.paramsManager,
      this.onParamsUpdate,
    );

    // this.taskDistributor = new TaskDistributor();
    // this.taskQueue = new TaskQueue();
  }

  setup() {
    this.interactionManager.attachEventListeners();
    window.requestAnimationFrame(this.renderLoop);
  }

  cleanup() {
    this.interactionManager.detachEventListeners();
  }

  onParamsUpdate = (targetParams: FrozenRenderParams) => {
    const targetTiles = getTilesForParams(
      targetParams,
      this.view,
      TILE_SIZE_IN_PX,
    );
  };

  private renderLoop = async () => {
    // if (this.hasNewTilesToRender()) {
    if (this.hasDataToRender) {
      this.render();
    }
    window.requestAnimationFrame(this.renderLoop);
  };

  private async render() {
    const params = this.paramsManager.current;
    const tileSizePx = TILE_SIZE_IN_PX;
    // await renderMandelbrot(this.canvas, params, tileSizePx);
    this.paramsManager.commitTarget();
  }

  get hasDataToRender() {
    return this.workQueue.length > 0;
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
