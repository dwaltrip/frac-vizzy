import { TILE_SIDE_LENGTH_IN_PIXELS } from '../settings';

import { assert } from '../lib/assert';
import { drawPixel } from '../lib/draw';

function drawTile({ ctx, tileId, points, viewport, getColor }) {
  const tileView = buildTileView({ tileId, viewport });
  // =====================================================================
  // TODO: Make sure I'm handling this correctly...
  //         I think the issue is that we call `drawTile` on every tile
  //         that is returned from a worker. But with the new queue,
  //         some tiles that are returned won't be part of the viewport.
  // 
  //       It should be fine to simply abort these tiles?
  //         There may be cleaner way of handling these tiles.
  //         I feel like the check should occur somewhere else?
  // =====================================================================
  if (tileView === null) {
    return;
  }

  const { visibleSection, renderOffset } = tileView;
  const { xRange, yRange } = visibleSection;

  // Occassionaly, a tile will overlap the edge by less than half a pixel.
  // So we don't actually need to render any pixels for this tile.
  if (visibleSection.width === 0 || visibleSection.height === 0) {
    return;
  }

  const imgDataForTile = ctx.createImageData(
    visibleSection.width,
    visibleSection.height,
  );

  for (let y=0; y < visibleSection.height; y++) {
    const row = points[visibleSection.yRange.start + y];

    for (let x=0; x < visibleSection.width; x++) {
      const status = row[visibleSection.xRange.start + x];
      const color = getColor(status);
      // =================================================================
      // TODO: occasionally hitting this error:
      //   TypeError: Cannot read properties of undefined (reading 'r')
      // This URL seems to do it:
      //   http://localhost:3000/?pos[r]=-1.2269794003&pos[c]=-0.1645804016&z=30&il=5000&cm=sqrt_iters&cg=(60,60,60,240,180,60)
      // I need to double check that it is a new error.
      // =================================================================
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
      r: topLeftPoint.r + sideLength,
      c: topLeftPoint.c - sideLength,
    },
  };

  if (!doRectsOverlap(viewportRect, tileRect)) {
    return null;
    // throw new Error('oops, the tile is NOT in the viewport...');
  }

  const interPixDist = viewport.interPixelDistance;

  const visibleSection = {
    xRange: { start: 0, end: TILE_SIDE_LENGTH_IN_PIXELS },
    yRange: { start: 0, end: TILE_SIDE_LENGTH_IN_PIXELS },
  };

  const renderOffset = {
    x: Math.round((tileRect.topLeft.r - viewportRect.topLeft.r) / interPixDist),
    y: Math.round((viewportRect.topLeft.c - tileRect.topLeft.c) / interPixDist),
  };

  // ----------------------------------------------------------------------------
  // TODO: Are there precision issues with this?
  // Is there a more precise / cleaner way to do this? Using the gridcoords maybe?
  // TODO: This only works for tiles that are partially outside of (and partially
  // inside of) the viewport.
  // It breaks if the tile is multiple tile-widths outside of the viewport...

  // tile overlaps with left edge of viewport
  if (tileRect.topLeft.r < viewportRect.topLeft.r) {
    visibleSection.xRange.start = Math.round(
      (viewportRect.topLeft.r - tileRect.topLeft.r) / interPixDist
    );
    renderOffset.x = 0;
  }
  // tile overlaps with right edge of viewport
  if (viewportRect.botRight.r < tileRect.botRight.r) {
    visibleSection.xRange.end = Math.round(
      (viewportRect.botRight.r - tileRect.topLeft.r) / interPixDist
    );
  }

  visibleSection.width = visibleSection.xRange.end - visibleSection.xRange.start;
  assert(visibleSection.width >= 0);
  assert(visibleSection.width <= TILE_SIDE_LENGTH_IN_PIXELS);

  // tile overlaps with top edge of viewport
  if (tileRect.topLeft.c > viewportRect.topLeft.c) {
    visibleSection.yRange.start = Math.round(
      (tileRect.topLeft.c - viewportRect.topLeft.c) / interPixDist
    );
    renderOffset.y = 0;
  }
  // tile overlaps with bottom edge of viewport
  if (viewportRect.botRight.c > tileRect.botRight.c) {
    visibleSection.yRange.end = Math.round(
      (tileRect.topLeft.c - viewportRect.botRight.c) / interPixDist
    );
    assert(
      0 <= visibleSection.yRange.end &&
      visibleSection.yRange.end <= TILE_SIDE_LENGTH_IN_PIXELS,
      'Bug adjusting visibleSection.yRange.end',
    );
  }

  visibleSection.height = visibleSection.yRange.end - visibleSection.yRange.start;
  assert(visibleSection.height >= 0);
  assert(visibleSection.height <= TILE_SIDE_LENGTH_IN_PIXELS);
  // ----------------------------------------------------------------------------
 
  return { visibleSection, renderOffset, tileId };
}

function doRectsOverlap(r1, r2) {
  const r1RealRange = { start: r1.topLeft.r, end: r1.botRight.r };
  const r2RealRange = { start: r2.topLeft.r, end: r2.botRight.r };

  const r1ComplexRange = { start: r1.botRight.c, end: r1.topLeft.c };
  const r2ComplexRange = { start: r2.botRight.c, end: r2.topLeft.c };

  return (
    doRangesOverlap(r1RealRange, r2RealRange) &&
    doRangesOverlap(r1ComplexRange, r2ComplexRange)
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
