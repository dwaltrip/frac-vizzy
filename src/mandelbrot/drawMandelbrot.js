import { round } from '../lib/round';
import { drawPixel } from '../lib/draw';

import { calcPlotState } from '../state/plot';
import { ComputeManager } from './computeManager';
import { buildColorMap } from './colorMap';

const REAL_START = -2;
const REAL_END = 2;
const COMPLEX_START = -2;
const COMPLEX_END = 2;

// ----------------------------------------------------------------

function drawMandelbrot({ canvas, params, onProgress }) {
  console.log('======== drawMandelbrot ========');

  // Clear the canvas
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // TODO: the color stuff needs a lot of work... it doesn't look like online pics.
  let colorMap = buildColorMap({
    realRange: params.realRange,
    complexRange: params.complexRange,
    iterationLimit: params.iterationLimit,
  });
  const getColor = val => colorMap.get(val);

  let t0 = performance.now();
  return ComputeManager.computePoints({
    params,
    plot: calcPlotState(canvas, params),
    onProgress,
    handleNewRow: ({ y, xValues }) => drawRow(ctx, y, xValues, getColor),
  }).then(() => {
    let t1 = performance.now();
    console.log(`Timer -- ComputeManager.computePoints() took ${t1 - t0} milliseconds.`);
  });
}

// ----------------------------------------------------------------------

function drawRow(ctx, y, xValues, getColor) {
  const imgDataForSingleRow = ctx.createImageData(cavans.width, 1);

  for (let x = 0; x < xValues.length; x++) {
    const status = xValues[x];
    // TODO: This magic number -1 should be in a shared const var somewhere,
    // as it is referenced in multiple places.
    const value = status.isInSet ? -1 : status.divergenceFactor;
    const color = getColor(value);
    drawPixel(imgDataForSingleRow, x, 0, color.r, color.g, color.b);
  }

  ctx.putImageData(imgDataForSingleRow, 0, y);
}

// ----------------------------------------------------------------------

export { drawMandelbrot };
