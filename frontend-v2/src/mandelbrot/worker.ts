// https://vitejs.dev/guide/features.html#web-workers
// The worker script can also use ESM import statements instead of importScripts().
import { expose } from 'comlink';
import { TileCalcTask, TileResult } from '@/mandelbrot/types';
import { computeTile } from '@/mandelbrot/tile';

const workerAPI = {
  async performWork(task: TileCalcTask): Promise<TileResult> {
    const { params } = task;
    return { params, data: computeTile(params) };
  },

  // Alt approach: Pass multiple tiles to a worker.
  // TODO: Remove this later if we never use it.
  // async performWork(paramList: TileParams[]): Promise<TileResult> {
  //   function sendResult(result: CalculationResult) {
  //     postMessage({ workerId, result });
  //   }

  //   paramsList.forEach((params) => {
  //     const output = computeTile(params);
  //     sendResult({ input: { params }, output });
  //   });
  //   // .......
  // }
};

expose(workerAPI);
