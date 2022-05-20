// This is heavily insired by greenlet: https://github.com/developit/greenlet
// However, greenlet doesn't support `Worker.terminate`, which is why I roll
//   my own version here.
import { createIdGenerator } from '../lib/IdGenerator';

const RUN_WORKER_EVENT = '__WORKERIFY__RUN_WORKER_EVENT__';

const generateWorkerId = createIdGenerator();

// TODO: Review this (and online examples) more carefully. How robust is this?
// TODO: handle errors... worker.onerror?
// TODO: Transferables?
function workerify(funcToWorkerify, dependencyFuncs, constants) {
  const workerCodeStr = [
    ...(Object.keys(constants || {}).map(constName => {
      return `const ${constName} = ${constants[constName]};`;
    })),
    ...(dependencyFuncs || []).map(fn => fn.toString()),
    'const $$ = ' + funcToWorkerify.toString() + ';',
    (
`addEventListener('message', event => {
  const { type } = event.data;
  if (type === '${RUN_WORKER_EVENT}') {
    $$();
  }
})`
  ),
  ].join('\n\n');
  // console.log('--- workerCodeStr -----------------------------\n');
  // console.log(workerCodeStr);
  // console.log('\n-----------------------------------------------');

  const workerUrl = window.URL.createObjectURL(
    new Blob([workerCodeStr], {type:'text/javascript'})
  );
  const worker = new Worker(workerUrl);

  const state = {
    messageListeners: [],
  };

  function cleanup() {
    worker.terminate();
    window.URL.revokeObjectURL(workerUrl);
  }

  const WorkerifyWorker = {
    id: generateWorkerId(),
  
    run() {
      worker.onmessage = event => {
        state.messageListeners.forEach(fn => fn(event.data));
      };
      worker.postMessage({ type: RUN_WORKER_EVENT });
    },

    postMessage(...args) {
      worker.postMessage(...args);
    },

    terminate() {
      cleanup();
      state.messageListeners = [];
    },

    listen(handler) {
      state.messageListeners.push(handler);
    },
  };
  return WorkerifyWorker;
}

export { workerify };
