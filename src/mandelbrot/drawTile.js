import { TILE_SIDE_LENGTH_IN_PIXELS } from '../settings';

import { assert } from '../lib/assert';
import { drawPixel } from '../lib/draw';

function drawTile({ ctx, tileId, points, viewport, getColor}) {
  const { visibleSection, renderOffset } = buildTileView({ tileId, viewport });
  const { xRange, yRange } = visibleSection;

  const imgDataForTile = ctx.createImageData(
    visibleSection.width,
    visibleSection.height,
  );

  for (let y=0; y < visibleSection.height; y++) {
    const row = points[visibleSection.yRange.start + y];

    for (let x=0; x < visibleSection.width; x++) {
      const status = row[visibleSection.xRange.start + x];
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
      drawPixel(imgDataForTile, x, y, color.r, color.g, color.b);
    }
  }

  ctx.putImageData(imgDataForTile, renderOffset.x, renderOffset.y); 
}


function buildTileView({ tileId, viewport }) {
  const { sideLength, topLeftPoint, gridCoord } = tileId;

  const viewportRect = {
    topLeft: viewport.topLeftPoint,
    botRight: viewport.botRightPoint,
  };
  const tileRect = {
    topLeft: topLeftPoint,
    botRight: {
      real: topLeftPoint.real + sideLength,
      complex: topLeftPoint.complex - sideLength,
    },
  };
  if (!doRectsOverlap(viewportRect, tileRect)) {
    throw new Error('oops, the tile is NOT in the viewport...');
  }

  const interPixDist = viewport.interPixelDistance;

  const visibleSection = {
    xRange: { start: 0, end: TILE_SIDE_LENGTH_IN_PIXELS },
    yRange: { start: 0, end: TILE_SIDE_LENGTH_IN_PIXELS },
  };

  const renderOffset = {
    x: Math.floor((tileRect.topLeft.real - viewportRect.topLeft.real) / interPixDist),
    y: Math.floor((viewportRect.topLeft.complex - tileRect.topLeft.complex) / interPixDist),
  };

  // ----------------------------------------------------------------------------
  // TODO: Are there precision issues with this?
  // Is there a more precise / cleaner way to do this? Using the gridcoords maybe?
  // TODO: This only works for tiles that are partially outside of (and partially
  // inside of) the viewport.
  // It breaks if the tile is multiple tile-widths outside of the viewport...

  // tile overlaps with left edge of viewport
  if (tileRect.topLeft.real < viewportRect.topLeft.real) {
    visibleSection.xRange.start = Math.floor(
      (viewportRect.topLeft.real - tileRect.topLeft.real) / interPixDist
    );
    renderOffset.x = 0;
  }
  // tile overlaps with right edge of viewport
  if (viewportRect.botRight.x < tileRect.botRight.x) {
    visibleSection.xRange.end = Math.floor(
      (viewportRect.botRight.real - tileRect.botRight.real) / interPixDist
    );
  }

  visibleSection.width = visibleSection.xRange.end - visibleSection.xRange.start;
  assert(visibleSection.width > 0);
  assert(visibleSection.width <= TILE_SIDE_LENGTH_IN_PIXELS);

  // tile overlaps with top edge of viewport
  if (tileRect.topLeft.complex > viewportRect.topLeft.complex) {
    visibleSection.yRange.start = Math.floor(
      (tileRect.topLeft.complex - viewportRect.topLeft.complex) / interPixDist
    );
    renderOffset.y = 0;
  }
  // tile overlaps with bottom edge of viewport
  if (viewportRect.botRight.complex > tileRect.botRight.complex) {
    visibleSection.yRange.end = Math.floor(
      (tileRect.topLeft.complex - viewportRect.botRight.complex) / interPixDist
    );
    assert(
      0 <= visibleSection.yRange.end &&
      visibleSection.yRange.end <= TILE_SIDE_LENGTH_IN_PIXELS,
      'Bug adjusting visibleSection.yRange.end',
    );
  }

  visibleSection.height = visibleSection.yRange.end - visibleSection.yRange.start;
  assert(visibleSection.height > 0);
  assert(visibleSection.height <= TILE_SIDE_LENGTH_IN_PIXELS);
  // ----------------------------------------------------------------------------
 
  return { visibleSection, renderOffset };
}

// Need to properly standardize / cleanup our terminology
// One of the issues is that I don't want to use "x,y" for both
// the math plane and for the pixel grid.
// The other issue is that "real, complex" is less ergonomic than "x,y"
// Maybe I should just use "r,c" in place of "real,complex"
function doRectsOverlap(r1, r2) {
  const r1XRange = { start: r1.topLeft.real, end: r1.botRight.real };
  const r2XRange = { start: r2.topLeft.real, end: r2.botRight.real };

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

export { drawTile, buildTileView };
