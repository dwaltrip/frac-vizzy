import { assert } from '../lib/assert';
import { WorkerManager } from './workerManager';
import { getTileIds } from './getTileIds';

const ComputeManager = {
  computePoints: function({ computeArgs, handleNewTile, onProgress }) {
    const { centerPos, zoomLevel, viewport, iterationLimit, numWorkers } = computeArgs;

    const tileIds = getTileIds({ centerPos, zoomLevel, viewport }).flat();
 
    const workerArgs = [...(new Array(numWorkers))].map((_, i) => ({
      tileIds: [],
      iterationLimit,
      workerNum: i,
    }));

    for (let i=0; i<tileIds.length; i++) {
      const workerNum = i % numWorkers;
      workerArgs[workerNum].tileIds.push(tileIds[i]);
    }

    const computedTiles = [];
    const totalTiles = tileIds.length;
    let tilesComputed = 0;

    const messageHandler = ({ label, data }) => {
      if (label == 'done-computing-tile') {
        computedTiles.push(data);
        handleNewTile(data);

        tilesComputed += 1;
        if (onProgress) {
          let percentComplete = Math.floor(100 * (tilesComputed / totalTiles));
          onProgress(percentComplete);
        }
      }
    };

    WorkerManager.terminateAllWorkers();

    // TODO: handle errors?
    return Promise.all(workerArgs.map(args => {
      const worker = WorkerManager.createWorker();
      worker.listen(messageHandler);
      return worker.run(args);
    })).then(() => {
      return computedTiles;
    });
  },
};

function computeArgsToTileDesc(computeArgs) {
  const { realRange, complexRange } = computeArgs;
  
}

export { ComputeManager };
