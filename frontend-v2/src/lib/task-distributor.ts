import { wrap, Remote, releaseProxy } from 'comlink'; // Assuming comlink types are available

// Frac Vizzy Worker
type FracVizzyWorker = Worker & {
  performCalculations(inputData: any): Promise<any>;
};

class TaskDistributor {
  private workerScript: string;
  private workers: Remote<FracVizzyWorker>[];

  constructor(workerScript: string, numberOfWorkers: number) {
    this.workerScript = workerScript;
    this.workers = [];
    this.setNumberOfWorkers(numberOfWorkers);
  }

  setNumberOfWorkers(newNumber: number): void {
    while (this.workers.length < newNumber) {
      this.workers.push(createWorker(this.workerScript));
    }
    while (this.workers.length > newNumber) {
      const worker = this.workers.pop();
      if (worker) {
        terminateWorker(worker);
      }
    }
  }

  distributeTasks(
    prepareInputsForWorkers: (inputData: any, workerCount: number) => any[],
    inputData: any,
  ): void {
    const preparedInputs = prepareInputsForWorkers(
      inputData,
      this.workers.length,
    );
    preparedInputs.forEach((input, index) => {
      if (this.workers[index]) {
        sendTask(this.workers[index], input);
      }
    });
  }
}

function createWorker(workerScript: string): Remote<FracVizzyWorker> {
  const worker = new Worker(workerScript, { type: 'module' });
  return wrap(worker);
}

function terminateWorker(worker: Remote<Worker>): void {
  worker[releaseProxy]();
}

function sendTask(worker: Remote<FracVizzyWorker>, inputData: any): void {
  worker.performCalculations(inputData).then((result) => {
    // Handle the result here
  });
}

export { TaskDistributor };
