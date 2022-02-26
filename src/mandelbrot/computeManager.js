import { assert } from '../lib/assert';
import { WorkerManager } from './workerManager';

// -----------------------------
// TODO: ... implement this....
const NUM_WORKERS = 4;
// -----------------------------

const ComputeManager = {
  computePoints: function({ computeArgs, handleNewTile, onProgress }) {

    const { realRange, complexRange } = computeArgs;
    assert(
      realRange.start >= -2 && realRange.end <= 2,
      `Invaid realRange: ${realRange}`,
    );
    assert(
      complexRange.start >= -2 && complexRange.end <= 2,
      `Invaid yrange: ${complexRange}`,
    );
 
    const workerArgs = [];
    for (let i=0; i<NUM_WORKERS; i++) {
      workerArgs.push({
        // main args:
        ...computeArgs,
        // parallelization args:
        workerOffset: i,
        numWorkers: NUM_WORKERS,
      });
    }

    let totalRows = complexRange.numSteps;
    let rowsComputed = 0;

    const messageHandler = ({ label, data }) => {
      if (label == 'done-computing-tile') {
        handleNewTile(data);

        rowsComputed += 1;
        if (onProgress) {
          let percentComplete = Math.floor(100 * (rowsComputed / totalRows));
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
    }));
  },
};

function computeArgsToTileDesc(computeArgs) {
  const { realRange, complexRange } = computeArgs;
  
}

export { ComputeManager };
