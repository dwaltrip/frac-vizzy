
import { assert } from './assert';
import { computeMandlebrotPoints } from './compute-mandelbrot';

const REAL_START = -2;
const REAL_END = 2;
const COMPLEX_START = -2;
const COMPLEX_END = 2;

const BAILOUT_LIMT = 100;

// ----------------------------------------------------------------

function drawMandelbrot(canvas, realRange, complexRange) {
  assert(
    realRange.start >= -2 && realRange.end <= 2,
    `Invaid realRange: ${realRange}`,
  );
  assert(
    complexRange.start >= -2 && complexRange.end <= 2,
    `Invaid yrange: ${complexRange}`,
  );
  const rLength = realRange.end - realRange.start;
  const cLength = complexRange.end - complexRange.start;

  var canvasWidth = canvas.width;
  var canvasHeight = canvas.height;

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

  var ctx = canvas.getContext("2d");
  var canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

  function drawPixel (x, y, r, g, b) {
    var index = (x + (y * canvasWidth)) * 4;

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
    const { x: startX, y: startY } = topLeft;
    for (let y=0; y<points.length; y++) {
      const row = points[y];
      for (let x=0; x<row.length; x++) {
        if (row[x] !== 0) {
          drawPixel(startX + x,startY + y, 0, 0, 0);
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

  const topLeft = {
    x: (canvasWidth - plotWidth) / 2,
    y: (canvasHeight - plotHeight) / 2,
  };
  console.log('topLeft:', topLeft);

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

export { drawMandelbrot };
