import { assert } from '../lib/assert';
import { WorkerManager } from './workerManager';

// -----------------------------
// TODO: ... implement this....
const NUM_WORKERS = 4;
// -----------------------------

const ComputeManager = {
  computePoints: function({ params, plot, handleNewRow, onProgress }) {

    const { realRange, complexRange } = params;

    assert(
      realRange.start >= -2 && realRange.end <= 2,
      `Invaid realRange: ${realRange}`,
    );
    assert(
      complexRange.start >= -2 && complexRange.end <= 2,
      `Invaid yrange: ${complexRange}`,
    );

    const computeArgs = {
      realRange: {
        ...realRange,
        numSteps: plot.width,
      },
      complexRange: {
        ...complexRange,
        numSteps: plot.height,
      },
      iterationLimit: params.iterationLimit,
    };

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

    let totalRows = plot.height;
    let rowsComputed = 0;

    const messageHandler = ({ label, data }) => {
      if (label == 'done-computing-row') {
        handleNewRow(data);

        rowsComputed += 1;
        if (onProgress) {
          let percentComplete = Math.floor(100 * (rowsComputed / totalRows)),
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

export { ComputeManager };
