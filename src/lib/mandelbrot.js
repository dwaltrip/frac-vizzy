
import { assert } from './assert';
import { getMousePos } from './getMousePos';
import { round } from './round';
import { drawPoints, drawLine } from './draw';
import { computeMandlebrotPoints } from './compute-mandelbrot';

const DEBUG = false;

const REAL_START = -2;
const REAL_END = 2;
const COMPLEX_START = -2;
const COMPLEX_END = 2;

const ITERATION_LIMIT = 250;
// const USE_COLORS = false;
const USE_COLORS = true;

const CANVAS_ZOOM_FACTOR = 4;

// ----------------------------------------------------------------

function initMandelbrot(canvas, realRange, complexRange, updatePlot) {
 console.log('======== initMandelbrot ========');

  assert(
    realRange.start >= -2 && realRange.end <= 2,
    `Invaid realRange: ${realRange}`,
  );
  assert(
    complexRange.start >= -2 && complexRange.end <= 2,
    `Invaid yrange: ${complexRange}`,
  );

  const state = { realRange, complexRange };

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  const rLength = realRange.end - realRange.start;
  const cLength = complexRange.end - complexRange.start;

  const rRatio = canvasWidth / rLength;
  const cRatio = canvasHeight / cLength;

  console.log('rRatio:', rRatio, '-- canvasWidth:', canvasWidth, '-- rLength:', rLength);
  console.log('cRatio:', cRatio, '-- canvasHeight:', canvasHeight, '-- cLength:', cLength);

  let plotHeight, plotWidth;

  // the complex-dimension is the constraining one
  if (rRatio > cRatio) {
    const pixelsPerPlotUnit = canvasHeight / cLength;
    plotHeight = canvasHeight;
    plotWidth = rLength * pixelsPerPlotUnit;
  }
  // the real-dimension is the constraining one
  else {
    const pixelsPerPlotUnit = canvasWidth / rLength;
    plotHeight = cLength * pixelsPerPlotUnit;
    plotWidth = canvasWidth ;
  }

  let xPlotOffset = (canvasWidth - plotWidth) / 2;
  let yPlotOffset = (canvasHeight - plotHeight) / 2;

  // NOTE: If `topLeft`` is not an integer, the plots can be very messed up.
  // TODO: Think about whether `Math.floor` is the correct fix (it seems to fix it).
  const topLeft = {
    x: Math.floor((canvasWidth - plotWidth) / 2),
    y: Math.floor((canvasHeight - plotHeight) / 2),
  };
  const botRight = { x: topLeft.x + plotWidth, y: topLeft.y + plotHeight };
  console.log('topLeft:', topLeft);

  function redraw() {
    drawMandelbrot(
      canvas,
      state.realRange,
      state.complexRange,
      plotHeight,
      plotWidth,
      topLeft,
    );
  }

  redraw();

  canvas.addEventListener('click', event => {
    console.log('----- canvas onclick -- start -------------');
    const mousePos = getMousePos(canvas, event);
    console.log('\tmousePos:', mousePos);

    const realRange = state.realRange;
    const complexRange = state.complexRange;
    const rLength = realRange.end - realRange.start;
    const cLength = complexRange.end - complexRange.start;

    if (
      (mousePos.x < topLeft.x || mousePos.x > botRight.x) ||
      (mousePos.y < topLeft.y || mousePos.y > botRight.y)
    ) {
      console.log('\tinvalid pos!');
      return;
    }

    // TODO: can I make this cleaner / less bug-prone?
    const xRatio = (mousePos.x - xPlotOffset) / plotWidth;
    const yRatio = (mousePos.y - yPlotOffset) / plotHeight;
    const newCenter = {
      x: realRange.start + (xRatio * rLength),
      y: complexRange.start + (yRatio * cLength),
    };

    console.log('\tnewCenter:', newCenter);

    const xLen = rLength / CANVAS_ZOOM_FACTOR;
    const yLen = cLength / CANVAS_ZOOM_FACTOR;

    state.realRange = {
      start: newCenter.x - (xLen / 2),
      end: newCenter.x + (xLen / 2),
      // start: round(newCenter.x - (xLen / 2), 10),
      // end: round(newCenter.x + (xLen / 2), 10),
    };
    state.complexRange = {
      start: newCenter.y - (yLen / 2),
      end: newCenter.y + (yLen / 2),
      // start: round(newCenter.y - (yLen / 2), 10),
      // end: round(newCenter.y + (yLen / 2), 10),

    };
    console.log('\trealRange:', state.realRange);
    console.log('\tcomplexRange:', state.complexRange);

    updatePlot(state.realRange, state.complexRange)

    console.log('----- canvas onclick -- redrawing... -----');
    redraw();
    console.log('-------------------------------------------')
  });
}

// ----------------------------------------------------------------

function drawMandelbrot(
  canvas,
  realRange,
  complexRange,
  plotHeight,
  plotWidth,
  topLeft,
) {

  const ctx = canvas.getContext("2d");

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let t0 = performance.now();
  const points = computeMandlebrotPoints({
    real_range: {
      start: realRange.start,
      end: realRange.end,
      num_steps: plotWidth,
    },
    complex_range: {
      start: complexRange.start,
      end: complexRange.end,
      num_steps: plotHeight, 
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

  t0 = performance.now();
  drawPoints(imgData, points, topLeft, colorMap);
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

export { initMandelbrot };
