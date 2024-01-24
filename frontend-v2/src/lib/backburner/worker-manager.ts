import { wrap, Remote, releaseProxy } from 'comlink';

import { IdGenerator } from './id-generator';

enum WorkerStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
}

// ----------------------------------------------------------------------------
// -- WorkerManager --

class WorkerManager {
  private workerScript: string;
  private workers: BackburnerWorker[];
  private onJobComplete: (result: any) => void;
  private getNextJob: () => any;

  constructor(
    workerScript: string,
    numberOfWorkers: number,
    onJobComplete: (result: any) => void,
    getNextJob: () => any,
  ) {
    this.workerScript = workerScript;
    this.workers = [];
    this.getNextJob = getNextJob;
    this.onJobComplete = onJobComplete;
    this.setNumberOfWorkers(numberOfWorkers);
  }

  setNumberOfWorkers(num: number): void {
    while (this.workers.length < num) {
      this.workers.push(new BackburnerWorker(this.workerScript));
    }
    while (this.workers.length > num) {
      const worker = this.workers.pop();
      if (worker) {
        worker.terminate();
      }
    }
  }

  get areAnyWorkersAvailable(): boolean {
    return this.workers.some((worker) => worker.isAvailable);
  }

  get nextJob() {
    return this.getNextJob();
  }

  get nextAvailableWorker(): BackburnerWorker | undefined {
    return this.workers.find((worker) => worker.isAvailable);
  }

  // This is purposefully idempotent.
  startWorking() {
    let job = this.nextJob;
    let worker = this.nextAvailableWorker;

    while (job && worker) {
      if (worker) {
        worker.startJob(job).then((result) => {
          this.onJobComplete(result);
        });
      }
      job = this.nextJob;
      worker = this.nextAvailableWorker;
    }
  }
}

// ----------------------------------------------------------------------------
// -- BackburnerWorker --

type _WrappedWorker = Worker & {
  performWork(inputData: any): Promise<any>;
};

class BackburnerWorker {
  id: string;
  status: WorkerStatus;
  private worker: Remote<_WrappedWorker>;
  private pendingResult: Promise<any> | null = null;

  get isAvailable(): boolean {
    return this.status === WorkerStatus.IDLE;
  }
  get isBusy(): boolean {
    return this.status === WorkerStatus.BUSY;
  }

  constructor(script: string) {
    this.id = BackburnerWorker._generateId();
    this.status = WorkerStatus.IDLE;
    this.worker = wrap(new Worker(script, { type: 'module' }));
  }

  startJob(job: any): Promise<any> {
    if (this.pendingResult) {
      throw new Error('Worker already has a pending job!');
    }

    // TODO: Error handling!!
    //  Catch and report errors!!
    this.pendingResult = this.worker.performWork(job).then((result: any) => {
      this.status = WorkerStatus.IDLE;
      this.pendingResult = null;
      return result;
    });
    // TODO: Why does TS think this is a Promise<any> | null?
    return this.pendingResult!;
  }

  terminate() {
    this.worker[releaseProxy]();
  }

  static _generateId = IdGenerator.asFunc(3);
}

export { WorkerManager };
