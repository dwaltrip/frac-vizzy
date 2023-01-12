import { assert } from 'lib/assert';

import { WorkerManager } from 'mandelbrot/workerManager';
import { getTileIds } from 'mandelbrot/getTileIds';
import { tileCache, MAX_TILE_CACHE_SIZE } from 'mandelbrot/tileCache';

const ComputeManager = {
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
};

function computeArgsToTileDesc(computeArgs) {
  const { realRange, complexRange } = computeArgs;
  
}

export { ComputeManager };
