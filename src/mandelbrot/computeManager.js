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

    // TODO: convert snake_case to camelCase
    const computeArgs = {
      real_range: {
        start: realRange.start,
        end: realRange.end,
        num_steps: plot.width,
      },
      complex_range: {
        start: complexRange.start,
        end: complexRange.end,
        num_steps: plot.height, 
      },
      iteration_limit: params.iterationLimit,
    };

    const workerArgs = [];
    for (let i=0; i<NUM_WORKERS; i++) {
      workerArgs.push({
        // main args
        computeArgs.real_range,
        computeArgs.complex_range,
        computeArgs.iteration_limit,

        // parallelization args
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
    return Promise.all(workerArgs.map(args => {
      const worker = WorkerManager.createWorker();
      worker.listen(messageHandler);
      return worker.run(args);
    }));
  },
};

export { ComputeManager };
