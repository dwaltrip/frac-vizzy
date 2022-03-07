import { assert } from '../lib/assert';
import { drawPixel } from '../lib/draw';
import { TILE_SIDE_LENGTH_IN_PIXELS } from '../settings';

import { getViewportInfo } from '../viewport';
import { ComputeManager } from './computeManager';
import { buildColorMap } from './colorMap';

const REAL_START = -2;
const REAL_END = 2;
const COMPLEX_START = -2;
const COMPLEX_END = 2;

// ----------------------------------------------------------------

// TODO: Across entire app, clean up / standardize the usage of the 
// the terminaology (real, complex) vs. (x, y)

function drawMandelbrot({ canvas, params, onProgress }) {
  console.log('======== drawMandelbrot ========');

  const viewport = getViewportInfo({ params, canvas });
  const computeArgs = {
    ...params,
    viewport,
  };

  // Clear the canvas
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ---- DISABLE_COLOR ----
  // TODO: the color stuff needs a lot of work... it doesn't look like online pics.
  // let colorMap = buildColorMap(computeArgs);
  // console.log(colorMap);
  // const maxColorKey = Math.max(...colorMap.keys());
  // let INSUFFICIENT_COLOR_MAP_COUNT = 0;
  // const getColor = val => {
  //   // ----------------------------------------------------------------------
  //   // TODO: This is a hack due to our shitty random sample thing.
  //   // Sometimes the maxDivergenceFactor it produces is not actually the max.
  //   // Fix this!!
  //   // ----------------------------------------------------------------------
  //   if (val > maxColorKey) {
  //     val = maxColorKey;
  //     INSUFFICIENT_COLOR_MAP_COUNT += 1;
  //   }
  //   return colorMap.get(val);
  // };
  // ---- ------------- ----
  const getColor = () => {};

  let t0 = performance.now();
  return ComputeManager.computePoints({
    computeArgs,
    onProgress,
    // TODO: Cache the tile data!!
    // Who is in charge of that?
    handleNewTile: ({ tileId, points }) => {
      drawTile({ ctx, tileId, points, viewport, getColor });
    },
  }).then(() => {
    let t1 = performance.now();
    console.log(`Timer -- ComputeManager.computePoints() took ${t1 - t0} milliseconds.`);
    // ---- DISABLE_COLOR ----
    // console.log('-- INSUFFICIENT_COLOR_MAP_COUNT:', INSUFFICIENT_COLOR_MAP_COUNT);
    // ---- ------------- ----
  });
}

// ----------------------------------------------------------------------

// TODO: need to be able to draw part of a tile
function drawTile({ ctx, tileId, points, viewport, getColor} ) {
  const [tileYLen, tileXLen] = [points.length, (points[0] || []).length];
  assert(
    tileYLen > 0 && tileXLen > 0,
    `Bad points -- tileXLen: ${tileXLen}, tileYLen: ${tileYLen}`
  );

  const { gridCoord, sideLength } = tileId;

  const tileTopLeft = {
    real: gridCoord.x * sideLength,
    complex: (gridCoord.y + 1) * sideLength,
  }; 

  const viewportRect = {
    topLeft: viewport.topLeftPoint,
    botRight: viewport.botRightPoint,
  };
  const tileRect = {
    topLeft: tileTopLeft,
    botRight: {
      real: tileTopLeft.real + sideLength,
      complex: tileTopLeft.complex - sideLength,
    },
  };
  if (!doRectsOverlap(viewportRect, tileRect)) {
    throw new Error('oops, the tile is NOT in the viewport...');
  }

  const interPixDist = viewport.interPixelDistance;

  const visibleTilePointsXRange = { start: 0, end: tileXLen };
  const visibleTilePointsYRange = { start: 0, end: tileYLen };

  // ----------------------------------------------------------------------------
  // TODO: Are there precision issues with this?
  // Is there a more precise / cleaner way to do this? Using the gridcoords maybe?
  if (tileRect.topLeft.real < viewportRect.topLeft.real) {
    visibleTilePointsXRange.start = (
      (viewportRect.topLeft.real - tileRect.topLeft.real) / interPixDist,
    );
  }
  if (viewportRect.botRight.x < tileRect.botRight.x) {
    visibleTilePointsXRange.end = (
      (viewportRect.botRight.real - tileRect.botRight.real) / interPixDist,
    );
  }
  let visibleTilePointsXLen = (
    visibleTilePointsXRange.end - visibleTilePointsXRange.start
  );

  assert(visibleTilePointsXLen > 0);
  assert(visibleTilePointsXLen <= tileXLen);
  assert(visibleTilePointsXLen <= TILE_SIDE_LENGTH_IN_PIXELS);

  if (tileRect.topLeft.complex > viewportRect.topLeft.complex) {
    visibleTilePointsXRange.start = (
      (tileRect.topLeft.complex - viewportRect.topLeft.complex) / interPixDist,
    );
  }
  if (tileRect.botRight.complex > viewportRect.botRight.complex) {
    visibleTilePointsXRange.end = (
      (tileRect.botRight.complex - viewportRect.botRight.complex) / interPixDist,
    );
  }
  let visibleTilePointsYLen = (
    visibleTilePointsYRange.end - visibleTilePointsYRange.start
  );

  assert(visibleTilePointsYLen > 0);
  assert(visibleTilePointsYLen <= tileYLen);
  assert(visibleTilePointsYLen <= TILE_SIDE_LENGTH_IN_PIXELS);
  // ----------------------------------------------------------------------------

  const imgDataForTile = ctx.createImageData(
    visibleTilePointsXLen,
    visibleTilePointsYLen,
  );

  for (let y=0; y < visibleTilePointsYLen; y++) {
    const row = points[visibleTilePointsYRange.start + y];
    assert(row.length === tileXLen, 'tile rows should be equal length');

    for (let x=0; x < visibleTilePointsXLen; x++) {
      const status = row[visibleTilePointsXRange.start + x];
      // ---- DISABLE_COLOR ----
      // TODO: This magic number -1 should be in a shared const var somewhere,
      // as it is referenced in multiple places.
      // const value = status.isInSet ? -1 : status.divergenceFactor;
      // const color = getColor(value);
      // ---- ------------- ----
      const color = (status.isInSet ?
        { r: 0, g: 0, b: 0 } :
        { r: 220, g: 230, b: 255 }
      );
      drawPixel(imgDataForTile, x, y, color.real, color.g, color.b);
    }
  }

  ctx.putImageData(imgDataForTile, offset.x, offset.y);
}

// ----------------------------------------------------------------------

// Need to properly standardize / cleanup our terminology
// One of the issues is that I don't want to use "x,y" for both
// the math plane and for the pixel grid.
// The other issue is that "real, complex" is less ergonomic than "x,y"
// Maybe I should just use "r,c" in place of "real,complex"

function doRectsOverlap(r1, r2) {
  const r1XRange = { start: r1.topLeft.real, end: r1.botRight.x };
  const r2XRange = { start: r2.topLeft.real, end: r2.botRight.x };

  const r1YRange = { start: r1.botRight.complex, end: r1.topLeft.complex };
  const r2YRange = { start: r2.botRight.complex, end: r2.topLeft.complex };

  return (
    doRangesOverlap(r1XRange, r2XRange) &&
    doRangesOverlap(r1YRange, r2YRange)
  );
}

function doRangesOverlap(r1, r2) {
  // If the start or beginning of r2 is within r1, they overlap.
  // It could be done the other way around (r1 within r2), same result.
  return (
    (r1.start <= r2.start && r2.start <= r1.end) ||
    (r1.start <= r2.end && r2.end <= r1.end)
  );
}

// ----------------------------------------------------------------------

export { drawMandelbrot };
