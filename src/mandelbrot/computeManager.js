import { assert } from '../lib/assert';
import { WorkerManager } from './workerManager';

const ComputeManager = {
  computePoints: function({ params, plot, onProgress }) {

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

    WorkerManager.terminateAllWorkers();
    const computePointsInWorker = WorkerManager.createWorker();

    computePointsInWorker.listen(data => {
      const { label, percentComplete } = data;
      if (label == 'progress-update') {
        onProgress && onProgress(percentComplete);
      } 
    });

    return computePointsInWorker(computeArgs);
  },
};

export { ComputeManager };
