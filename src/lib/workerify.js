// This is heavily insired by greenlet: https://github.com/developit/greenlet
// However, greenlet doesn't support `Worker.terminate`, which is why I roll
//   my own version here.

// TODO: Review this (and online examples) more carefully. How robust is this?
// TODO: handle errors... worker.onerror?
// TODO: Transferables?
const WORKERIFY_MESSAGE_IDENTIFIER = '__$WORKERIFY_MESSAGE_IDENTIFIER';

function workerify(funcToWorkerify) {
  const workerCodeStr = [
    '$$ = ' + funcToWorkerify.toString() + ';',
    (
`onmessage = function(e) {
  const result = $$(e.data);
  postMessage({
    result,
    '${WORKERIFY_MESSAGE_IDENTIFIER}': true,
  });
}`),
  ].join('\n');

  const workerUrl = window.URL.createObjectURL(
    new Blob([workerCodeStr], {type:'text/javascript'})
  );
  const worker = new Worker(workerUrl);

  const state = {
    messageListeners: [],
    isRunning: false,
  };

  function cleanup() {
    worker.terminate();
    window.URL.revokeObjectURL(workerUrl);
  }

  const WrappedWorker = {
    run(args) {
      args = [].slice.call(arguments);

      if (!state.isRunning) {
        state.isRunning = true;
        worker.postMessage(...(args.length > 0 ? args : [null]));
      }
      else {
        throw new Error('workerify -- run() should only be called once.');
      }

      return new Promise((resolve, reject) => {
        worker.onmessage = e => {
          if (e.data[WORKERIFY_MESSAGE_IDENTIFIER]) {
            resolve(e.data.result);
            cleanup();
          }
          else {
            state.messageListeners.forEach(fn => fn(e.data));
          }
        };
      });
    },

    terminate() {
      cleanup();
      state.messageListeners = [];
    },

    listen(handler) {
      state.messageListeners.push(handler);
    },
  };

  return WrappedWorker;
}

export { workerify };
