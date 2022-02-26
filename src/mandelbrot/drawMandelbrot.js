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
    // TODO: Cache the tile data!!
    // Who is in charge of that?
    // -------------------------
    // I don't understand `pos` here.
    handleNewTile: ({ tile, pos }) => {
      const offset = { 
        x: plot.topLeft.x + pos.x,
        y: plot.topLeft.y + pos.y,
      };
      drawTile(ctx, offset, tile, getColor);
    },
  }).then(() => {
    let t1 = performance.now();
    console.log(`Timer -- ComputeManager.computePoints() took ${t1 - t0} milliseconds.`);
    console.log('-- INSUFFICIENT_COLOR_MAP_COUNT:', INSUFFICIENT_COLOR_MAP_COUNT);
  });
}

// ----------------------------------------------------------------------

// TODO: how do I know how many pixels are in a tile?
function drawTile(ctx, params, tile) {
  const { realRange, complexRange } = params;

  const { data, sideLength } = tile;
  // const { tileRealRange, tileComplexRange } = tile;

  if (tile.realRange.start - 

  const visibleWidth = 
  const visibleHeight = 

  const imgDataForTile = ctx.createImageData(visibleWidth, visibleHeight);
}

// TODO: need to be able to draw part of a tile
function drawTile(ctx, offset, tile, getColor) {
  const [yLen, xLen] = [tile.length, (tile[0] || []).length];
  assert(yLen > 0 && xLen > 0, `Bad tile -- xLen: ${xLen}, yLen: ${yLen}`);


  const imgDataForTile = ctx.createImageData(xLen, yLen);

  for (let y = 0; x < yLen; x++) {
    const row = tile[y];
    assert(row.length === xLen, 'tile rows should be equal length');

    for (let x=0; x<xLen; x++) {
      const status = row[x];
      // TODO: This magic number -1 should be in a shared const var somewhere,
      // as it is referenced in multiple places.
      const value = status.isInSet ? -1 : status.divergenceFactor;
      const color = getColor(value);
      drawPixel(imgDataForTile, x, y, color.r, color.g, color.b);
    }
  }

  ctx.putImageData(imgDataForTile, offset.x, offset.y);
}

// ----------------------------------------------------------------------

export { drawMandelbrot };
