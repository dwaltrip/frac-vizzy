import { TILE_SIDE_LENGTH_IN_PIXELS } from '../settings';

import { getViewportInfo } from '../viewport';
import { ComputeManager } from './computeManager';
import { buildColorMap } from './colorMap';
import { drawLine } from '../lib/draw';

import { drawTile } from './drawTile';

const REAL_START = -2;
const REAL_END = 2;
const COMPLEX_START = -2;
const COMPLEX_END = 2;

const DEBUG = false;
// const DEBUG = true;

window.TILE_DATA = {};

// ----------------------------------------------------------------

// TODO: Across entire app, clean up / standardize the usage of the 
// the terminaology (real, complex) vs. (x, y)

function drawMandelbrot({ canvas, params, onProgress }) {
  console.log('======== drawMandelbrot ========');

  const viewport = getViewportInfo({ params, canvas });
  const computeArgs = {
    ...params,
    viewport,
  };

  // Clear the canvas
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // TODO: the color stuff needs more work... it doesn't look like online pics.
  let colorMap = buildColorMap(computeArgs);
  const maxColorKey = Math.max(...colorMap.keys());
  // ----------------------------------------------------------------------
  // TODO: `maxColorKey` is a hack due to our shitty random sample thing.
  // Sometimes the maxDivergenceFactor it produces is not actually the max.
  // Fix this!!
  // ----------------------------------------------------------------------
  const getColor = val => (val > maxColorKey ?
    colorMap.get(maxColorKey) :
    colorMap.get(val)
  );

  let t0 = performance.now();
  return ComputeManager.computePoints({
    computeArgs,
    onProgress,
    // TODO: Cache the tile data!!
    // Who is in charge of that?
    handleNewTile: ({ tileId, points }) => {
      drawTile({ ctx, tileId, points, viewport, getColor });
    },
  }).then(() => {
    let t1 = performance.now();
    console.log(`Timer -- ComputeManager.computePoints() took ${t1 - t0} milliseconds.`);

    if (DEBUG) {
      drawLine(ctx, { x: 0, y: 350 }, { x: 700, y: 350 }, { r: 255, g: 0, b: 0, a: 0.5 }, 1);
      drawLine(ctx, { x: 350, y: 0 }, { x: 350, y: 700 }, { r: 255, g: 0, b: 0, a: 0.5 }, 1);
    }
  });
}

export { drawMandelbrot };
