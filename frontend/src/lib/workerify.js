// This is heavily insired by greenlet: https://github.com/developit/greenlet
// However, greenlet doesn't support `Worker.terminate`, which is why I roll
//   my own version here.

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

// ----------------------------------------------------------
// TODO: If the `addEventListener` approach works,
// then I can remove this janky way of passing messages
// to the worker code of `workerify` users.
// ----------------------------------------------------------
//     (
// `const messageHandlers = [];

// function addMessageHandler(handler) {
//   messageHandlers.push(handler);
// }

// onmessage = function(e) {
//   messageHandlers.forEach(handler => handler(e.data));
// }`),

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
