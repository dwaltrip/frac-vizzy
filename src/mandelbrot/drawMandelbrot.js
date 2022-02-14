import { round } from '../lib/round';
import { drawPoints, drawLine } from '../lib/draw';

import { calcPlotState } from '../state/plot';
import { ComputeManager } from './computeManager';

const DEBUG = false;

const REAL_START = -2;
const REAL_END = 2;
const COMPLEX_START = -2;
const COMPLEX_END = 2;

// const USE_COLORS = false;
const USE_COLORS = true;

// ----------------------------------------------------------------

function drawMandelbrot({ canvas, params, onProgress }) {
  console.log('======== drawMandelbrot ========');

  // Clear the canvas
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ------------------------------------------------------
  // TODO: How are we going to build the color map?
  // Before we were waiting until we had all of the points.
  let colorMap = new Map();
  const getColor = val => colorMap.get(val);
  // ------------------------------------------------------

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
  const imgDataForRow = ctx.createImageData(cavans.width, 1);

  for (let x = 0; x < xValues.length; x++) {
    let color = getColor(xValues[x]);
    drawPixel(imgDataForRow, x, 0, color.r, color.g, color.b);
  }

  ctx.putImageData(imgDataForRow, 0, y);
}

// ----------------------------------------------------------------

// TODO: the color stuff needs a lot of work... it doesn't look like online pics.
function getColorMap(points) {
  let maxDivergenceFactor = 0;
  forEachPoint(points, status => {
    if (status.divergenceFactor > maxDivergenceFactor) {
      maxDivergenceFactor = status.divergenceFactor;
    }
  });

  for (let y=0; y<points.length; y++) {
    const row = points[y];
    for (let x=0; x<row.length; x++) {
      const status = row[x];

      if (USE_COLORS) {
        row[x] = status.isInSet ? -1 : status.divergenceFactor;
      } else {
        row[x] = status.isInSet ? -1 : 0;
      }
    }
  }

  // const bgColor = { r: 247, g: 243, b: 238 };
  // const bgColor = { r: 227, g: 223, b: 228 };
  const bgColor = { r: 220, g: 230, b: 255 };
  const lightenTo = 0.55;
  // const lightenTo = 0.85;
  let colorRange = {
    start: {
      r: bgColor.r * lightenTo,
      g: bgColor.g * lightenTo,
      b: bgColor.b * lightenTo,
    },
    end: bgColor,
  };

  const colorMap = new Map([
    [-1, { r: 0, g: 0, b: 0 }],
  ]);
  if (!USE_COLORS) {
    // plain single color background
    colorMap.set(0, bgColor);;
  }

  if (USE_COLORS) {
    for (let i=0; i<=maxDivergenceFactor; i++) {
      const percent = i / maxDivergenceFactor;
      const r = percentToRangeVal(percent, colorRange.start.r, colorRange.end.r);
      const g = percentToRangeVal(percent, colorRange.start.g, colorRange.end.g);
      const b = percentToRangeVal(percent, colorRange.start.b, colorRange.end.b);
      colorMap.set(i, { r, g, b });
    }
  }

  // console.log('colorMap:', colorMap);
  return colorMap;
}

// ----------------------------------------------------------------------

function forEachPoint(points, fn) {
  for (let y=0; y<points.length; y++) {
    const row = points[y];

    for (let x=0; x<row.length; x++) {
      const val = row[x];  
      fn(val);
    }
  }
}

function percentToRangeVal(percent, start, end) {
  return Math.floor(start + (percent * (end - start)));
}

export { drawMandelbrot };
