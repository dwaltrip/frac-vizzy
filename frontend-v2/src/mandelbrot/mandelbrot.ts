// import { TaskDistributor } from '@/lib/task-distributor';
import { Backburner } from '@/lib/backburner';
import { BasicCache } from '@/lib/basic-cache';

import { CanvasManager } from '@/mandelbrot/canvas-manager';
import { SetStatus, TileCoord } from '@/mandelbrot/types';

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

type TileId = string;

interface TileParams {
  coord: TileCoord;
}

interface TileResult {
  data: SetStatus[][];
}

class Mandelbrot {
  private canvasManager: CanvasManager;
  private backburner: Backburner<TileParams, TileResult>;

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    numWorkers: number,
  ) {
    this.backburner = new Backburner(new BasicCache<TileResult>(), numWorkers);
    this.canvasManager = new CanvasManager(container, canvas);

    // this.taskDistributor = new TaskDistributor();
    // this.taskQueue = new TaskQueue();
  }

  setup(): void {
    this.canvasManager.setup();
  }

  cleanup(): void {
    this.canvasManager.cleanup();
  }
}

export { Mandelbrot };
