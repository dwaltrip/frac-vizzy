import { wrap, Remote, releaseProxy, UnproxyOrClone } from 'comlink';

import { IdGenerator } from './id-generator';

enum WorkerStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
}

// ----------------------------------------------------------------------------
// -- WorkerManager --

interface WorkerManagerHooks<TaskInputs, TaskResult> {
  beforeTask?: (task: TaskInputs) => void;
  afterTask?: (task: TaskInputs, result: TaskResult) => void;
}

class WorkerManager<TaskInputs, TaskResult> {
  private workers: BackburnerWorker<TaskInputs, TaskResult>[];

  // -------------------------------------------------------------------------------------
  // NOTE: For `workerFactory`, we need a function that returns an actual worker instance.
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
  constructor(
    private workerFactory: () => Worker,
    numberOfWorkers: number,
    private taskRelay: TaskRelay<TaskInputs>,
    private hooks: WorkerManagerHooks<TaskInputs, TaskResult> = {},
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

  get allWorkers(): BackburnerWorker<TaskInputs, TaskResult>[] {
    return this.workers;
  }
  get busyWorkers(): BackburnerWorker<TaskInputs, TaskResult>[] {
    return this.workers.filter((worker) => worker.isBusy);
  }

  createWorker(): BackburnerWorker<TaskInputs, TaskResult> {
    return new BackburnerWorker<TaskInputs, TaskResult>(this.workerFactory());
  }

  get areAnyWorkersAvailable(): boolean {
    return this.workers.some((worker) => worker.isAvailable);
  }

  popNextTask(): TaskInputs | null {
    return this.taskRelay.popNext();
  }

  requireNextTask(): TaskInputs {
    const task = this.popNextTask();
    if (!task) {
      throw new Error('No tasks available');
    }
    return task;
  }

  get hasTask(): boolean {
    return this.taskRelay.hasTasks;
  }

  get nextAvailableWorker():
    | BackburnerWorker<TaskInputs, TaskResult>
    | undefined {
    return this.workers.find((worker) => worker.isAvailable);
  }

  startWorking() {
    let worker = this.nextAvailableWorker;
    while (this.hasTask && worker) {
      const taskInput = this.requireNextTask();
      this.beforeTask && this.beforeTask(taskInput);

      worker.startTask(taskInput).then((result: TaskResult) => {
        this.afterTask(taskInput, result);
        this.startWorking();
      });

      worker = this.nextAvailableWorker;
    }
  }

  beforeTask(taskInput: TaskInputs) {
    const handler = this.hooks.beforeTask;
    handler && handler(taskInput);
  }

  afterTask(taskInput: TaskInputs, result: TaskResult) {
    const handler = this.hooks.afterTask;
    handler && handler(taskInput, result);
  }
}

class TaskRelay<TaskInputs> {
  private _hasTasks: () => boolean;
  popNext: () => TaskInputs | null;

  constructor(hasTasks: () => boolean, popNext: () => TaskInputs | null) {
    this.popNext = popNext;
    this._hasTasks = hasTasks;
  }

  get hasTasks(): boolean {
    return this._hasTasks();
  }
}

// ----------------------------------------------------------------------------
// -- BackburnerWorker --

type _WrappedWorker<Inputs, Outputs> = Worker & {
  performWork(inputs: Inputs): Promise<Outputs>;
};

class BackburnerWorker<TaskInputs, TaskResult> {
  id: string;
  status: WorkerStatus;

  private worker: Remote<_WrappedWorker<TaskInputs, TaskResult>>;
  private pendingResult: Promise<TaskResult> | null = null;

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

  async startTask(task: TaskInputs): Promise<TaskResult> {
    if (this.pendingResult) {
      console.warn(`DEBUG -- worker: ${this.id}, status: ${this.status}`);
      console.warn(`DEBUG -- pendingResult: ${this.pendingResult}`);
      throw new Error('Worker already has a pending task!');
    }

    this.status = WorkerStatus.BUSY;

    const result = this.worker
      // `performWork` takes `TaskInputs`, but comlink seems to change the type.
      // Not sure if this cast is the correct fix.
      .performWork(task as UnproxyOrClone<TaskInputs>)
      .then((result) => {
        this.status = WorkerStatus.IDLE;
        this.pendingResult = null;
        // Comlink doesn't infer that values from the worker will match their
        // declared types after serialization/deserialization, so it types them
        // as `unknown`. We know the worker returns TaskResult, so it's safe to cast.
        return result as TaskResult;
      })
      .catch((error: Error) => {
        console.error('Worker task failed:', {
          workerId: this.id,
          error: error.message,
          stack: error.stack,
        });
        throw error;
      });

    this.pendingResult = result;
    return result;
  }

  terminate() {
    this.worker[releaseProxy]();
  }

  static _generateId = IdGenerator.asFunc(3);
}

export { WorkerManager, TaskRelay };
