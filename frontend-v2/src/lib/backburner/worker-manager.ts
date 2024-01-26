import { wrap, Remote, releaseProxy } from 'comlink';

import { IdGenerator } from './id-generator';
import { TileResult } from '@/mandelbrot/types';

enum WorkerStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
}

// ----------------------------------------------------------------------------
// -- WorkerManager --

class WorkerManager<JobResult> {
  private workerURL: URL;
  private workers: BackburnerWorker<JobResult>[];
  private onJobComplete: (result: any) => void;
  private getNextJob: () => any;

  constructor(
    workerURL: URL,
    numberOfWorkers: number,
    onJobComplete: (result: any) => void,
    getNextJob: () => any,
  ) {
    this.workerURL = workerURL;
    this.workers = [];
    this.getNextJob = getNextJob;
    this.onJobComplete = onJobComplete;
    this.setNumberOfWorkers(numberOfWorkers);
  }

  setNumberOfWorkers(num: number): void {
    while (this.workers.length < num) {
      this.workers.push(new BackburnerWorker<JobResult>(this.workerURL));
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

  get nextAvailableWorker(): BackburnerWorker<JobResult> | undefined {
    return this.workers.find((worker) => worker.isAvailable);
  }

  // This is purposefully idempotent.
  startWorking() {
    let job = this.nextJob;
    let worker = this.nextAvailableWorker;

    while (job && worker) {
      if (worker) {
        // TODO: handle errors
        worker.startJob(job).then((result) => {
          this.onJobComplete(result);
          this.startWorking();
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
  // performWork(workerId: string, inputs: any): Promise<any>;
  performWork(inputs: any): Promise<any>;
};

class BackburnerWorker<Result> {
  id: string;
  status: WorkerStatus;
  private worker: Remote<_WrappedWorker>;
  private pendingResult: Promise<Result> | null = null;

  get isAvailable(): boolean {
    return this.status === WorkerStatus.IDLE;
  }
  get isBusy(): boolean {
    return this.status === WorkerStatus.BUSY;
  }

  constructor(workerURL: URL) {
    this.id = BackburnerWorker._generateId();
    this.status = WorkerStatus.IDLE;
    this.worker = wrap(new Worker(workerURL, { type: 'module' }));
  }

  // TODO: Get rid of these any types
  startJob(job: any): Promise<Result> {
    if (this.pendingResult) {
      console.log(
        'DEBUG -- worker:',
        this.id,
        '\nstatus:',
        this.status,
        '\npendingResult:',
        this.pendingResult,
        '\npendingResult.then:',
        this.pendingResult?.then,
      );
      throw new Error('Worker already has a pending job!');
    }

    this.status = WorkerStatus.BUSY;
    // TODO: Error handling!!
    //  Catch and report errors!!
    this.pendingResult = this.worker
      .performWork(job)
      .then((result: Result) => {
        this.status = WorkerStatus.IDLE;
        this.pendingResult = null;
        return result;
      })
      .catch((error: any) => {
        // TODO: what else should we do here?
        console.error('-- performWork error --');
        console.error(error);
        throw error;
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
