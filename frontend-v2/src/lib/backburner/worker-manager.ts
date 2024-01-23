import { wrap, Remote, releaseProxy } from 'comlink';

type BackburnerWorker = Worker & {
  performWork(inputData: any): Promise<any>;
};

class WorkerManager {
  private workerScript: string;
  private workers: Remote<BackburnerWorker>[];

  constructor(workerScript: string, numberOfWorkers: number) {
    this.workerScript = workerScript;
    this.workers = [];
    this.setNumberOfWorkers(numberOfWorkers);
  }

  static initAndSetup(workerScript: string, numWorkers: number): WorkerManager {
    const manager = new WorkerManager(workerScript, numWorkers);
    // manager.foo();
    return manager;
  }

  setNumberOfWorkers(num: number): void {
    while (this.workers.length < num) {
      this.workers.push(createWorker(this.workerScript));
    }
    while (this.workers.length > num) {
      const worker = this.workers.pop();
      if (worker) {
        terminateWorker(worker);
      }
    }
  }
}

function createWorker(workerScript: string): Remote<BackburnerWorker> {
  const worker = new Worker(workerScript, { type: 'module' });
  return wrap(worker);
}

function terminateWorker(worker: Remote<Worker>): void {
  worker[releaseProxy]();
}

function sendTask(worker: Remote<BackburnerWorker>, taskParams: any): void {
  worker.performWork(taskParams).then((result: any) => {
    console.log('performWork - result:', result);
  });
}

export { WorkerManager };
