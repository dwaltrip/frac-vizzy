import { WorkerManager } from './worker-manager';

// type CalcId = string;

// interface Calcluation

interface ResultCache<T> {
  get(key: string): T;
  set(key: string, value: T): void;
  has(key: string): boolean;
}

class Backburner<JobParam, JobResult> {
  private cache: ResultCache<JobResult>;
  // TODO: use an actual queue with priorities?
  private jobQueue: any[];
  private workerManager: WorkerManager;

  constructor(cache: ResultCache<JobResult>, numWorkers: number) {
    this.cache = cache;
    this.jobQueue = [];
    this.workerManager = new WorkerManager(
      'worker.js', // TODO: pass in worker script
      numWorkers,
      () => this.getNextJob(),
    );
  }

  getNextJob(): any {
    return this.jobQueue.shift();
  }

  queueJob(params: any[]): void {
    this.jobQueue.push(...params);
  }

  setNumberOfWorkers(numWorkers: number): void {
    this.workerManager.setNumberOfWorkers(numWorkers);
  }
}

export { Backburner };
