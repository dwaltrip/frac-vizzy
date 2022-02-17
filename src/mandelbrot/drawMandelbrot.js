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

  const plot = calcPlotState(canvas, params);
  const computeArgs = {
    realRange: {
      ...params.realRange,
      numSteps: plot.width,
    },
    complexRange: {
      ...params.complexRange,
      numSteps: plot.height,
    },
    iterationLimit: params.iterationLimit,
  };

  // Clear the canvas
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // TODO: the color stuff needs a lot of work... it doesn't look like online pics.
  let colorMap = buildColorMap(computeArgs);
  console.log(colorMap);
  const maxColorKey = Math.max(...colorMap.keys());
  let INSUFFICIENT_COLOR_MAP_COUNT = 0;
  const getColor = val => {
    // ----------------------------------------------------------------------
    // TODO: This is a hack due to our shitty random sample thing.
    // Sometimes the maxDivergenceFactor it produces is not actually the max.
    // Fix this!!
    // ----------------------------------------------------------------------
    if (val > maxColorKey) {
      val = maxColorKey;
      INSUFFICIENT_COLOR_MAP_COUNT += 1;
    }
    return colorMap.get(val);
  };

  let t0 = performance.now();
  return ComputeManager.computePoints({
    computeArgs,
    onProgress,
    handleNewRow: ({ y, xValues }) => {
      const offset = { 
        x: plot.topLeft.x,
        y: plot.topLeft.y + y,
      };
      drawRow(ctx, offset, xValues, getColor);
    }
  }).then(() => {
    let t1 = performance.now();
    console.log(`Timer -- ComputeManager.computePoints() took ${t1 - t0} milliseconds.`);
    console.log('-- INSUFFICIENT_COLOR_MAP_COUNT:', INSUFFICIENT_COLOR_MAP_COUNT);
  });
}

// ----------------------------------------------------------------------

function drawRow(ctx, offset, xValues, getColor) {
  const imgDataForSingleRow = ctx.createImageData(xValues.length, 1);

  for (let x = 0; x < xValues.length; x++) {
    const status = xValues[x];
    // TODO: This magic number -1 should be in a shared const var somewhere,
    // as it is referenced in multiple places.
    const value = status.isInSet ? -1 : status.divergenceFactor;
    const color = getColor(value);
    drawPixel(imgDataForSingleRow, x, 0, color.r, color.g, color.b);
  }

  ctx.putImageData(imgDataForSingleRow, offset.x, offset.y);
}

// ----------------------------------------------------------------------

export { drawMandelbrot };
