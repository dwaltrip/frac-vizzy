// https://vitejs.dev/guide/features.html#web-workers
// The worker script can also use ESM import statements instead of importScripts().

import { expose } from 'comlink';
import { SetStatus, TileCoord } from '@/mandelbrot/types';
import { computeTile } from '@/mandelbrot/tile';

type TileData = SetStatus[][];

interface CalculationResult {
  input: { coord: TileCoord };
  output: TileData;
}

const workerAPI = {
  async computeTiles(workerId: string, coords: TileCoord[]) {
    function sendResult(result: CalculationResult) {
      postMessage({ workerId, result });
    }

    coords.forEach((coord) => {
      const output = computeTile(coord);
      sendResult({ input: { coord }, output });
    });
  },
};

expose(workerAPI);
