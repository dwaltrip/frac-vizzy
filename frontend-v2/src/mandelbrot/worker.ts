// https://vitejs.dev/guide/features.html#web-workers
// The worker script can also use ESM import statements instead of importScripts().

import { expose } from 'comlink';
import { TileParams, TileResult } from '@/mandelbrot/types';
import { computeTile } from '@/mandelbrot/tile';

const workerAPI = {
  async performWork(paramsList: TileParams[]): Promise<TileResult> {
    if (!paramsList || paramsList.length !== 1) {
      const paramsListInfo: string = [
        'typeof paramsList:',
        typeof paramsList,
        'paramsList.length:',
        paramsList?.length,
        'keys:',
        Object.keys(paramsList || {}),
      ].join('\n');
      console.error('-- Invalid paramsList -- debug info --', paramsListInfo);
      throw new Error('Invalid paramsList');
    }

    const params = paramsList[0]!;
    return { params, data: computeTile(params) };

    // function sendResult(result: CalculationResult) {
    //   postMessage({ workerId, result });
    // }

    // paramsList.forEach((params) => {
    //   const output = computeTile(params);
    //   sendResult({ input: { params }, output });
    // });
  },
};

expose(workerAPI);
