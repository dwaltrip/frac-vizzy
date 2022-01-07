
import { assert } from './assert';
import { getMousePos } from './getMousePos';
import { round } from './round';
import { computeMandlebrotPoints } from './compute-mandelbrot';

const REAL_START = -2;
const REAL_END = 2;
const COMPLEX_START = -2;
const COMPLEX_END = 2;

const BAILOUT_LIMT = 100;

const CANVAS_ZOOM_FACTOR = 3;

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

    const xRatio = mousePos.x / canvasWidth;
    const yRatio = mousePos.y / canvasHeight;
    const newCenter = {
      x: realRange.start + (xRatio * rLength),
      y: complexRange.start + (yRatio * cLength),
    };

    console.log('\tnewCenter:', newCenter);

    const xLen = rLength / CANVAS_ZOOM_FACTOR;
    const yLen = cLength / CANVAS_ZOOM_FACTOR;

    state.realRange = {
      start: round(newCenter.x - (xLen / 2), 10),
      end: round(newCenter.x + (xLen / 2), 10),
    };
    state.complexRange = {
      start: round(newCenter.y - (yLen / 2), 10),
      end: round(newCenter.y + (yLen / 2), 10),
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

  const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  function drawPixel (x, y, r, g, b) {
    // if (Math.random() < .0001) {
    //   console.log(`(x: ${x}, y: ${y})`);
    // }
    var index = (x + (y * canvas.width)) * 4;

    canvasData.data[index + 0] = r;
    canvasData.data[index + 1] = g;
    canvasData.data[index + 2] = b;
    canvasData.data[index + 3] = 255;
  }

  function updateCanvas() {
    ctx.putImageData(canvasData, 0, 0);
  }

  // TODO: make sure y-axis is not flipped...
  function drawPoints(points, topLeft) {
    // console.log('Number of points:', points.length * (points[0] || []).length);
    const { x: startX, y: startY } = topLeft;
    for (let y=0; y<points.length; y++) {
      const row = points[y];
      for (let x=0; x<row.length; x++) {
        if (row[x] !== 0) {
          drawPixel(startX + x, startY + y, 0, 0, 0);
        } else {
          // This creates a background color.
          drawPixel(startX + x,startY + y, 230, 230, 230);
        }
      }
    }
  }

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
    bailout_limit: BAILOUT_LIMT,
  });
  let t1 = performance.now();
  console.log(`Timer -- computeMandlebrotPoints() took ${t1 - t0} milliseconds.`);

  t0 = performance.now();
  drawPoints(points, topLeft);
  updateCanvas();
  t1 = performance.now();
  console.log(`Timer -- drawPoints() and updateCanvas() took ${t1 - t0} milliseconds.`);

  // drawGrid(
  //   { x: 0, y: 0 },
  //   { x: canvas.width, y: canvas.height },
  //   REAL_END - REAL_START,
  //   COMPLEX_END - COMPLEX_START,
  // );

  function drawGrid(topLeft, botRight, numHorizontalLines, numVertLines) {
    const dx = (botRight.x - topLeft.x) / numHorizontalLines;
    const dy = (botRight.y - topLeft.y) / numVertLines;

    // vertical lines
    for(let i=1; i<numVertLines; i++) {
      drawLine(ctx,
        { x: topLeft.x + (i*dx), y: topLeft.y },
        { x: topLeft.x + (i*dx), y: botRight.y },
      );
    }

    // horizontal lines
    for(let i=1; i<numHorizontalLines; i++) {
      drawLine(ctx,
        { x: topLeft.x,  y: topLeft.y + (i*dy) },
        { x: botRight.x, y: topLeft.y + (i*dy) },
      );
    }
  }

  function drawLine(ctx, p1, p2) {
    // console.log(p1, p2);
    const preStyle = ctx.strokeStyle 
    // ctx.strokeStyle = 'rgba(50, 50, 150, 0.5)';
    ctx.strokeStyle = 'rgba(224, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();       // Start a new path
    ctx.moveTo(p1.x, p1.y);    // Move the pen to (30, 50)
    ctx.lineTo(p2.x, p2.y);  // Draw a line to (150, 100)
    ctx.stroke();          // Render the path
    ctx.strokeStyle = preStyle;
  }
}

export { initMandelbrot };
