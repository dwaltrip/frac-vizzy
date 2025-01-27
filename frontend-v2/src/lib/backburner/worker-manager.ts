import { wrap, Remote, releaseProxy } from 'comlink';

import { IdGenerator } from './id-generator';

enum WorkerStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
}

// ----------------------------------------------------------------------------
// -- WorkerManager --

// TODO: can we get rid of the any types?
// Maybe w/ generics the way we use `TaskResult`?
interface WorkerManagerHooks {
  beforeTask?: (task: any) => void;
  afterTask?: (task: any, result: any) => void;
}

class WorkerManager<TaskResult> {
  private workers: BackburnerWorker<TaskResult>[];

  // -------------------------------------------------------------------------------------
  // NOTE: We need a function that returns an actual worker instance.
  // Before, WorkerManager received a plain string for the path to the worker script.
  // But for peculiar reasons, this breaks in vitejs prod builds.
  // You HAVE to create the Worker using the exact syntax of:
  // ```
  //  const worker = new Worker(new URL('./path-to-my-worker.ts', import.meta.url), { type: 'module' });
  // ```
  // Namely, you can't do something like:
  // ```
  //   const urlPath = './path-to-my-worker.ts';
  //   const worker = new Worker(new URL(urlPath, import.meta.url), { type: 'module' });
  // ```
  // This class is agnostic to what the worker does, so it doesn't know the URL.
  // So the best solution I could come up with is to ask for a function that creates the worker,
  // using the above syntax.
  // This isn't in the vitejs docs unfortunately... but this seems to be the way you have to do it.
  // -------------------------------------------------------------------------------------
  private workerFactory: () => Worker;
  private taskRelay: TaskRelay;
  private hooks: WorkerManagerHooks;

  constructor(
    workerFactory: () => Worker,
    numberOfWorkers: number,
    taskRelay: TaskRelay,
    hooks: WorkerManagerHooks = {},
  ) {
    this.hooks = hooks || {};
    this.workerFactory = workerFactory;

    this.workers = [];
    this.taskRelay = taskRelay;

    this.setNumberOfWorkers(numberOfWorkers);
  }

  setNumberOfWorkers(num: number): void {
    while (this.workers.length < num) {
      this.workers.push(this.createWorker());
    }
    while (this.workers.length > num) {
      const worker = this.workers.pop();
      if (worker) {
        // ---------------------------------------------------------------------------------
        // TODO: I'm seeing old workers in the chrome console, even after they're terminated.
        // Check if we are using releaseProxy correctly.
        // ---------------------------------------------------------------------------------
        worker.terminate();
      }
    }
  }

  get allWorkers(): BackburnerWorker<TaskResult>[] {
    return this.workers;
  }
  get busyWorkers(): BackburnerWorker<TaskResult>[] {
    return this.workers.filter((worker) => worker.isBusy);
  }

  createWorker(): BackburnerWorker<TaskResult> {
    return new BackburnerWorker<TaskResult>(this.workerFactory());
  }

  get areAnyWorkersAvailable(): boolean {
    return this.workers.some((worker) => worker.isAvailable);
  }

  popNextTask(): any | null {
    return this.taskRelay.popNext();
  }
  get hasTask(): boolean {
    return this.taskRelay.hasTasks;
  }

  get nextAvailableWorker(): BackburnerWorker<TaskResult> | undefined {
    return this.workers.find((worker) => worker.isAvailable);
  }

  startWorking() {
    let worker = this.nextAvailableWorker;
    while (this.hasTask && worker) {
      // TODO: handle errors
      // TODO: The term "task" is a little misleading...
      //   It's more like "task params", which are passed to the worker.
      //   In our case, the actual value is a TileParams object.
      const task = this.popNextTask();
      this.beforeTask && this.beforeTask(task);

      worker.startTask(task).then((result: any) => {
        this.afterTask(task, result);
        this.startWorking();
      });

      worker = this.nextAvailableWorker;
    }
  }

  beforeTask(task: any) {
    const handler = this.hooks.beforeTask;
    handler && handler(task);
  }

  afterTask(task: any, result: any) {
    const handler = this.hooks.afterTask;
    handler && handler(task, result);
  }
}

class TaskRelay {
  private _hasTasks: () => boolean;
  popNext: () => any | null;

  constructor(hasTasks: () => boolean, popNext: () => any | null) {
    this.popNext = popNext;
    this._hasTasks = hasTasks;
  }

  get hasTasks(): boolean {
    return this._hasTasks();
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

  constructor(workerInstance: Worker) {
    this.id = BackburnerWorker._generateId();
    this.status = WorkerStatus.IDLE;
    this.worker = wrap(workerInstance);
  }

  // TODO: Get rid of these any types
  async startTask(task: any): Promise<Result> {
    if (this.pendingResult) {
      console.warn(`DEBUG -- worker: ${this.id}, status: ${this.status}`);
      console.warn(`DEBUG -- pendingResult: ${this.pendingResult}`);
      throw new Error('Worker already has a pending task!');
    }

    this.status = WorkerStatus.BUSY;

    // TODO: Improve error handling
    this.pendingResult = this.worker
      .performWork(task)
      .then((result: Result) => {
        this.status = WorkerStatus.IDLE;
        this.pendingResult = null;
        return result;
      })
      .catch((error: any) => {
        console.error('-- performWork error --');
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

export { WorkerManager, TaskRelay };
