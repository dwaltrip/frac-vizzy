import { WorkerManager } from './worker-manager';

// type CalcId = string;

// interface Calcluation

class Backburner {
  // TODO: use an actual queue with priorities?
  private workQueue: any[];
  private workerManager: WorkerManager;

  constructor(numWorkers: number) {
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
