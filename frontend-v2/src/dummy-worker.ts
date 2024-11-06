// https://vitejs.dev/guide/features.html#web-workers
// The worker script can also use ESM import statements instead of importScripts().

import { expose } from 'comlink';

interface Result {
  result: any;
  timeInMs: number;
}

const workerAPI = {
  async performWork(max: number): Promise<Result> {
    return timeFunc(() => countPrimes(max));
  },
};

function countPrimes(N: number): number {
  let count = 0;
  for (let i = 2; i < N; i++) {
    let isPrime = true;
    const iSqrt = Math.ceil(Math.sqrt(i));
    for (let j = 2; j <= iSqrt; j++) {
      if (i % j === 0 && i !== j) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      count += 1;
    }
  }
  return count;
}

function timeFunc(func: () => any) {
  const start = performance.now();
  const result = func();
  const end = performance.now();
  // console.log('time:', (end - start).toFixed(3), 'ms')
  return { result, timeInMs: end - start };
}

expose(workerAPI);
