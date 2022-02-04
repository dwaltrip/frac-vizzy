import { createMandelbrotComputeWorker } from '../lib/computeMandelbrot';

let workers = [];

const MandelbrotWorkerManager = {
  terminateAllWorkers: function() {
    workers.forEach(worker => worker.terminate());
    workers = [];
  },

  createWorker: function() {
    const worker = createMandelbrotComputeWorker();
    workers.push(worker);
    return worker;
  },
};

export { MandelbrotWorkerManager };
