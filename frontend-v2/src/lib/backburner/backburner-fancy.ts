import { WorkerManager } from './worker-manager';

// type CalcId = string;

// interface Calcluation

interface ResultCache<T> {
  getKey(key: string): T;
  setKey(key: string, value: T): void;
  hasKey(key: string): boolean;
}

class Backburner<CalcParam, CalcResult> {
  // TODO: use an actual queue with priorities?
  private workQueue: CalcParam[];
  private workerManager: WorkerManager;

  constructor(
    private cache: ResultCache<CalcResult>,
    numWorkers: number,
  ) {
    this.cache = cache;
    this.workQueue = [];
    this.workerManager = WorkerManager.initAndSetup(numWorkers);
  }

  queueWork(params: CalcParam[]): void {
    this.workQueue.push(...params);
  }

  setNumberOfWorkers(numWorkers: number): void {
    this.workerManager.setNumberOfWorkers(numWorkers);
  }
}

export { Backburner };
