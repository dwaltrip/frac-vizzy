// This is heavily insired by greenlet: https://github.com/developit/greenlet
// However, greenlet doesn't support `Worker.terminate`, which is why I roll
//   my own version here.

// TODO: Review this (and online examples) more carefully. How robust is this?
// TODO: handle errors... worker.onerror?
// TODO: Transferables?
function workerify(fn) {
  const workerCodeStr = [
    '$$ = ' + fn.toString() + ';',
    (
`onmessage = function(e) {
  const result = $$(e.data);
  postMessage(result);
}`),
  ].join('\n');
  console.log('--- workerify --- workerCodeStr:')
  console.log(workerCodeStr);
  console.log('--------------------------------')

  const workerUrl = window.URL.createObjectURL(
    new Blob([workerCodeStr], {type:'text/javascript'})
  );
  const worker = new Worker(workerUrl);

  let isRunning = false;

  const workerAsFn = function(args) {
    args = [].slice.call(arguments);

    if (!isRunning) {
      isRunning = true;
      worker.postMessage(...args);
    }
    else {
      throw new Error('workerify -- worker is already running...');
    }

    return new Promise((resolve, reject) => {
      worker.onmessage = e => {
        console.log('workerify -- worker.onmessage');
        resolve(e.data);
      };
    });
  };

  workerAsFn.terminate = ()=> {
    worker.terminate();
    window.URL.revokeObjectURL(workerUrl);
  };

  return workerAsFn;
}

export { workerify };
