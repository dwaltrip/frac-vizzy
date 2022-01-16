import { assert } from './assert';
import { round } from './round';
import { drawPoints, drawLine } from './draw';

import { calcPlotState } from '../state/plot';
import { computeMandlebrotPoints } from './compute-mandelbrot';

const DEBUG = false;

const REAL_START = -2;
const REAL_END = 2;
const COMPLEX_START = -2;
const COMPLEX_END = 2;

const ITERATION_LIMIT = 250;
// const USE_COLORS = false;
const USE_COLORS = true;

// ----------------------------------------------------------------

function drawMandelbrot({ canvas, configs, setConfigs }) {
 console.log('======== drawMandelbrot ========');

  const { realRange, complexRange } = configs;

  const plot = calcPlotState(canvas, configs);

  assert(
    realRange.start >= -2 && realRange.end <= 2,
    `Invaid realRange: ${realRange}`,
  );
  assert(
    complexRange.start >= -2 && complexRange.end <= 2,
    `Invaid yrange: ${complexRange}`,
  );

  let t0 = performance.now();
  const points = computeMandlebrotPoints({
    real_range: {
      start: realRange.start,
      end: realRange.end,
      num_steps: plot.width,
    },
    complex_range: {
      start: complexRange.start,
      end: complexRange.end,
      num_steps: plot.height, 
    },
    iteration_limit: ITERATION_LIMIT,
  });
  let t1 = performance.now();

  console.log(`Timer -- computeMandlebrotPoints() took ${t1 - t0} milliseconds.`);

  // ------- TODO: this needs a lot of work... it doesn't look good -------
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
  const lightenTo = 0.85;
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
  console.log('colorMap:', colorMap);
  // ----------------------------------------------------------------------

  const ctx = canvas.getContext("2d");

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  t0 = performance.now();
  drawPoints(imgData, points, plot.topLeft, colorMap);
  // Render the data onto the canvas!
  ctx.putImageData(imgData, 0, 0);
  t1 = performance.now();

  if (DEBUG) {
    drawLine(ctx,
      { x: Math.floor(canvas.width / 2), y: 0 },
      { x: Math.floor(canvas.width / 2), y: canvas.height },
      { r: 224, g: 0, b: 0, a: 0.25 }, 
    );
    drawLine(ctx,
      { y: Math.floor(canvas.height / 2), x: 0 },
      { y: Math.floor(canvas.height / 2), x: canvas.width },
      { r: 224, g: 0, b: 0, a: 0.25 }, 
    );
  }

  console.log(`Timer -- rendering took ${t1 - t0} milliseconds.`);
}

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
