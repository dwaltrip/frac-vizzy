import { createMandelbrotComputeWorker } from 'mandelbrot/computeMandelbrot';

let workers = [];

const WorkerManager = {
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

export { WorkerManager };
