import { assert } from '../lib/assert';
import { getTileIds } from './getTileIds';
import { tileCache, MAX_TILE_CACHE_SIZE } from './tileCache';

import { createMandelbrotComputeWorker } from './computeMandelbrot';

// ----------------------------------------------------------------------------

// TODO: This could be a generic data structure??
// TTCQ is an acronym for "Tiles to Compute Queue"
const TTCQ = {
  _queue: [],

  replace(tileIds) {
    this._queue = [...(tileIds.reverse())];
  },

  pop() {
    return this._queue.pop();
  },

  get isEmpty() {
    return this._queue.length === 0;
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
    });
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
        if (WorkerManager.isAvailable(worker)) {
          sendNextTileToWorker(worker);
        }
      });
    });
  },

  updateNumWorkers(numWorkers) {
    if (numWorkers < WorkerManager.count) {
      const numToRemove = WorkerManager.count - numWorkers;

      for (let i=0; i<numToRemove; i++) {
        // TODO: Do we need to do anything else here?
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
