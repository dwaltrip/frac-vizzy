// TODO: move from lib/ to mandelbrot/

import { assert } from './assert';
import { round } from './round';
import { drawPoints, drawLine } from './draw';

import { calcPlotState } from '../state/plot';
import { MandelbrotWorkerManager } from '../mandelbrot/mandelbrotWorkerManager';

const DEBUG = false;

const REAL_START = -2;
const REAL_END = 2;
const COMPLEX_START = -2;
const COMPLEX_END = 2;

// const USE_COLORS = false;
const USE_COLORS = true;

// ----------------------------------------------------------------

function drawMandelbrot({ canvas, params }) {
  console.log('======== drawMandelbrot ========');

  const { realRange, complexRange } = params;
  const plot = calcPlotState(canvas, params);

  assert(
    realRange.start >= -2 && realRange.end <= 2,
    `Invaid realRange: ${realRange}`,
  );
  assert(
    complexRange.start >= -2 && complexRange.end <= 2,
    `Invaid yrange: ${complexRange}`,
  );

  MandelbrotWorkerManager.terminateAllWorkers();
  const computePointsInWorker = MandelbrotWorkerManager.createWorker();

  const args = {
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
    iteration_limit: params.iterationLimit,
  };

  let t0 = performance.now();
  computePointsInWorker(args).then(points => {
    let t1 = performance.now();
    console.log(`Timer -- computeMandlebrotPoints() took ${t1 - t0} milliseconds.`);
    render(points);
  });

  function render(points) {
    const ctx = canvas.getContext("2d");

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const colorMap = getColorMap(points);

    let t0 = performance.now();
    drawPoints(imgData, points, plot.topLeft, colorMap);
    // Render the data onto the canvas!
    ctx.putImageData(imgData, 0, 0);
    let t1 = performance.now();

    console.log(`Timer -- rendering took ${t1 - t0} milliseconds.`);
  }
}

// ----------------------------------------------------------------------

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
