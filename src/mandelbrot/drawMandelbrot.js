import { TILE_SIDE_LENGTH_IN_PIXELS, COLOR_METHODS } from '../settings';

import { getViewportInfo } from '../viewport';
import { ComputeManager } from './computeManager';
import { buildGetColorForPoint, buildGetColorForPointUsingHistogram } from './colorMap';
import { drawTile } from './drawTile';
import { drawLine } from '../lib/draw';
import { getAxesInPixelCoords } from '../debugHelpers';

const DEBUG = false;
// const DEBUG = true;

function drawMandelbrot({ canvas, params, systemParams, onProgress }) {
  console.log('------- drawMandelbrot -------')
  const { colorMethod, colorGradient } = params;

  const viewport = getViewportInfo(params, canvas);
  const computeArgs = {
    ...params,
    numWorkers: systemParams.numWorkers,
    viewport,
  };

  // Clear the canvas
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let getColor;
  if (params.colorMethod !== COLOR_METHODS.histogram) {
    getColor = buildGetColorForPoint({ colorMethod, colorGradient, ...computeArgs });
  }

  const histogram = {
    data: {},
    numPoints: 0,

    increment(val) {
      if (colorMethod === COLOR_METHODS.histogram2) {
        val = Math.ceil(Math.pow(val, .75));
      }
      if (!(val in this.data)) {
        this.data[val] = 0;
      }
      this.data[val] += 1;
    },

    updateForPoints(points) {
      points.forEach(row => {
        row.forEach(status => {
          const [isInSet, iterationCount] = status;
          this.increment(iterationCount);
          this.numPoints += 1;
        });
      });
    }
  };

  let t0 = performance.now();
  return ComputeManager.computePlot({
    computeArgs,
    onProgress,
    handleNewTile: ({ tileId, points }) => {
      if (colorMethod === COLOR_METHODS.histogram || colorMethod == COLOR_METHODS.histogram2) {
        histogram.updateForPoints(points);
      }
      else {
        drawTile({ ctx, tileId, points, viewport, getColor });
      }
    },
  }).then(tiles => {
    if (params.colorMethod === COLOR_METHODS.histogram || params.colorMethod === COLOR_METHODS.histogram2) {
      const getColorV2 = buildGetColorForPointUsingHistogram(histogram, params);
      tiles.forEach(({ tileId, points }) => {
        drawTile({ ctx, tileId, points, viewport, getColor: getColorV2 });
      });
    }

    let t1 = performance.now();
    console.log(`Timer -- computing and rendering took ${t1 - t0} milliseconds.`);

    if (DEBUG) {
      drawDebugStuff(ctx, viewport);
    }
  });
}

function drawDebugStuff(ctx, viewport) {
  const { rAxis, cAxis } = getAxesInPixelCoords(viewport);

  // draw the real and complex axes
  if (rAxis && cAxis) {
    drawLine(ctx, cAxis.a, cAxis.b, { r: 255, g: 0, b: 0, a: 0.8 });
    drawLine(ctx, rAxis.a, rAxis.b, { r: 255, g: 0, b: 0, a: 0.8 });
  }

  // draw lines down the center of the plot
  const { height: h, width: w } = viewport;
  const xMid = Math.round(w / 2);
  const yMid = Math.round(h / 2);
  const color = { r: 0, g: 255, b: 0, a: 0.7 };
  drawLine(ctx, { x: 0, y: yMid - 1 }, { x: w, y: yMid - 1 }, color);
  drawLine(ctx, { x: xMid - 1, y: 0 }, { x: xMid - 1, y: h }, color);
}

export { drawMandelbrot };
