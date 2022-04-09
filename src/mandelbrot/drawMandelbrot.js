import { TILE_SIDE_LENGTH_IN_PIXELS, COLOR_METHODS } from '../settings';

import { getViewportInfo } from '../viewport';
import { ComputeManager } from './computeManager';
import { buildGetColorForPoint, buildGetColorForPointUsingHistogram } from './colorMap';
import { drawLine } from '../lib/draw';
import { drawTile } from './drawTile';

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
      drawLine(ctx, { x: 0, y: 350 }, { x: 700, y: 350 }, { r: 255, g: 0, b: 0, a: 0.5 }, 1);
      drawLine(ctx, { x: 350, y: 0 }, { x: 350, y: 700 }, { r: 255, g: 0, b: 0, a: 0.5 }, 1);
    }
  });
}

export { drawMandelbrot };
