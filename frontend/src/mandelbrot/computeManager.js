import { assert } from 'lib/assert';

import { getTileIds } from 'mandelbrot/getTileIds';
import { tileCache, MAX_TILE_CACHE_SIZE } from 'mandelbrot/tileCache';
import { createMandelbrotComputeWorker } from 'mandelbrot/computeMandelbrot';

// ----------------------------------------------------------------------------

// TODO: This could be a generic data structure??
// TTCQ is an acronym for "Tiles to Compute Queue"
const TTCQ = {
  _queue: [],

  replace(tileIds) {
    this._queue = ([...tileIds]).reverse();
  },

  pop() {
    assert(!this.isEmpty, 'Cannot pop if the queue is empty');
    return this._queue.pop();
  },

  get length() {
    return this._queue.length;
  },

  get isEmpty() {
    return this.length === 0;
  },
};

/// ----------------------------------------------------------------------------

const WORKER_IS_AVAILABLE = 'WORKER_IS_AVAILABLE';
const WORKER_IS_BUSY = 'WORKER_IS_BUSY';

const WorkerManager = {
  createWorker() {
    const worker = createMandelbrotComputeWorker();
    this._list.push(worker);
    this.setAsAvailable(worker);
    return worker;
  },

  get count() {
    return this._list.length;
  },

  pop() {
    const removed = this._list.pop();
    delete this._statusMap[removed.id];
    return removed;
  },

  forEachWorker(fn) {
    this._list.forEach(fn);
  },

  getStatus(worker) {
    return this._statusMap[worker.id];
  },

  isAvailable(worker) {
    return this.getStatus(worker) === WORKER_IS_AVAILABLE;
  },

  setAsAvailable(worker) {
    this._statusMap[worker.id] = WORKER_IS_AVAILABLE
  },

  setAsBusy(worker) {
    this._statusMap[worker.id] = WORKER_IS_BUSY;
  },

  get areAllWorkersAvailable() {
    const numAvailableWorkers = this._list.filter(worker => {
      return this.isAvailable(worker);
    }).length;
    return numAvailableWorkers === this.count;
  },

  _list: [],
  _statusMap: {},
};

// ----------------------------------------------------------------------------

const ComputeManager = {
  computePlot: function({
    computeArgs,
    handleNewTile: _handleNewTile,
    onProgress
  }) {
    const { centerPos, zoomLevel, viewport, iterationLimit } = computeArgs;

    const tilesForPlot = [];

    // Wrap `handleNewTile` so we can collect the tiles for the plot.
    function handleNewTile(tileData) {
      tilesForPlot.push(tileData);
      _handleNewTile(tileData);
    }

    const tileIds = getTileIds({
      centerPos, 
      zoomLevel,
      viewport,
      cacheParams: { iterationLimit },
    }).flat();

    const cachedTileIds = tileIds.filter(tileId => tileCache.hasItem(tileId));
    const uncachedTileIds = tileIds.filter(tileId => !tileCache.hasItem(tileId));

    cachedTileIds.forEach(tileId => handleNewTile(tileCache.getItem(tileId)));

    // -------------------------------------------------------------------------
    // TODO: The first time the page loads, `computePlot` is called twice.
    // As a result, the first tile that each worker picks up is computed twice.
    // One fix possible fix is to keep track of which tiles are currently 
    // being computed and not add those. Kind of ugly.
    // I wonder if we can prevent `computePlot` from firing twice on page load.
    // For example, it doesn't happen when I zoom.
    // NOTE: I believe this issue already existed prior to any tile-queue work.
    // -------------------------------------------------------------------------
    TTCQ.replace(uncachedTileIds);

    const numToCompute = uncachedTileIds.length;
    let computedCount = 0;

    function sendNextTileToWorker(worker) {
      const tileId = TTCQ.pop();

      WorkerManager.setAsBusy(worker);
      worker.postMessage({
        type: 'compute-tile', // TOOD: fix magic string, make into a constant
        args: { tileId, iterationLimit },
      }); 
    }

    return new Promise((resolve, reject) => {
      if (WorkerManager.areAllWorkersAvailable && TTCQ.isEmpty) {
        resolve(tilesForPlot);
      }

      function handleTileDataFromWorker(
        worker,
        { type, data: { tileId, points } },
      ) {
        // TODO: fix this magic string, use a constant
        if (type !== 'done-computing-tile') {
          throw new Error(`Unsupported message type: ${type}`);
        }

        tileCache.addItem({ tileId, points });
        handleNewTile({ tileId, points });

        computedCount += 1;
        if (onProgress) {
          // TODO: there is bug in this calculation sometimes...
          // I saw "Working... 114%" at one point. It was stuck on that amount.
          let percentDone = Math.floor(100 * (computedCount / numToCompute));
          onProgress(percentDone);
        }

        if (TTCQ.isEmpty) {
          WorkerManager.setAsAvailable(worker);

          if (WorkerManager.areAllWorkersAvailable) {
            resolve(tilesForPlot);
          }
        }
        else {
          sendNextTileToWorker(worker);
        }
      }

      WorkerManager.forEachWorker(worker => {
        worker.replaceListen(data => handleTileDataFromWorker(worker, data));

        // Sometimes all the needed tiles are cached, so the queue is empty.
        if (!TTCQ.isEmpty && WorkerManager.isAvailable(worker)) {
          sendNextTileToWorker(worker);
        }
      });
    });
  },

  updateNumWorkers(numWorkers) {
    if (numWorkers < WorkerManager.count) {
      const numToRemove = WorkerManager.count - numWorkers;

      for (let i=0; i<numToRemove; i++) {
        // TODO: What about if the worker is currently busy computing?
        const worker = WorkerManager.pop();
        worker.terminate(); 
      }
    }
    else {
      const numToCreate = numWorkers - WorkerManager.count;
      for (let i=0; i<numToCreate; i++) {
        const newWorker = WorkerManager.createWorker();
        newWorker.run();
      }
    }
  },
};

export { ComputeManager };
