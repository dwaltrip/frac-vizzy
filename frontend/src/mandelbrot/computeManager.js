import { assert } from 'lib/assert';

import { WorkerManager } from 'mandelbrot/workerManager';
import { getTileIds } from 'mandelbrot/getTileIds';
import { tileCache, MAX_TILE_CACHE_SIZE } from 'mandelbrot/tileCache';

const ComputeManager = {
  _workers: {
    get count() {
      return this.list.length;
    },

    list: [],

    isBusy: {

    },
  },

  computePlotV2: function({
    computeArgs,
    handleNewTile: _handleNewTile,
    onProgress,
  }) {
    // Don't need to pass `numWorkers`. ComputeManager is already aware of that
    // via `updateNumWorkers`
    const { centerPos, zoomLevel, viewport, iterationLimit } = computeArgs;
  },

  computePlot: function({
    computeArgs,
    handleNewTile: _handleNewTile,
    onProgress
  }) {
    const { centerPos, zoomLevel, viewport, iterationLimit, numWorkers } = computeArgs;

    const tileIds = getTileIds({
      centerPos, 
      zoomLevel,
      viewport,
      cacheParams: { iterationLimit },
    }).flat();

    const cachedTileIds = tileIds.filter(tileId => tileCache.hasItem(tileId));
    const uncachedTileIds = tileIds.filter(tileId => !tileCache.hasItem(tileId));
 
    const workerArgs = [...(new Array(numWorkers))].map((_, i) => ({
      tileIds: [],
      iterationLimit,
      workerNum: i,
    }));

    for (let i=0; i<uncachedTileIds.length; i++) {
      const workerNum = i % numWorkers;
      workerArgs[workerNum].tileIds.push(uncachedTileIds[i]);
    }

    const tilesForPlot = [];

    // Wrap `handleNewTile` so we can collect the tiles for the plot.
    function handleNewTile(tileData) {
      tilesForPlot.push(tileData);
      _handleNewTile(tileData);
    }

    const numToCompute = uncachedTileIds.length;
    let computedCount = 0;
    const handleDataFromWorkers = ({ label, data: { tileId, points } }) => {
      if (label == 'done-computing-tile') {
        tileCache.addItem({ tileId, points });
        handleNewTile({ tileId, points });

        computedCount += 1;
        if (onProgress) {
          let percentDone = Math.floor(100 * (computedCount / numToCompute));
          onProgress(percentDone);
        }
      }
    };

    WorkerManager.terminateAllWorkers();

    cachedTileIds.forEach(tileId => handleNewTile(tileCache.getItem(tileId)));

    // TODO: handle errors?
    return Promise.all(workerArgs.map(args => {
      const worker = WorkerManager.createWorker();
      worker.listen(handleDataFromWorkers);
      return worker.run(args);
    })).then(() => {
      return tilesForPlot;
    });
  },

  updateNumWorkers(numWorkers) {
    if (numWorkers < this._workers.count) {
      const numToRemove = this._workers.count - numWorkers;
      for (let i=0; i<numToRemove; i++) {
        const worker = this._workers.list.pop();
        // TODO: what else happens here????
        worker.cleanup(); 
      }
    }
    else {
      const numToCreate = numWorkers - this._workers.count;
      for (let i=0; i<numToRemove; i++) {
        const newWorker = createWorker();
        this._workers.push(newWorker);
        // ---------------------------------------
        // TODO: set worker status to available???
        // ---------------------------------------
      }
    }
  },
};

export { ComputeManager };
