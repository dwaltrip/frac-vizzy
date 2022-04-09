import { assert } from '../lib/assert';

import { getSideLength } from './calcs';

const TILE_ORIGIN = { r: 0, c: 0 };

// ----------------------------------------------------------------------------

function getTileIds({ centerPos, viewport, zoomLevel, cacheParams }) {
  const topLeftPoint = {
    r: centerPos.r - (viewport.realLen / 2),
    c: centerPos.c + (viewport.complexLen / 2),
  };
  const botRightPoint = {
    r: centerPos.r + (viewport.realLen / 2),
    c: centerPos.c - (viewport.complexLen / 2),
  };

  const topLeftTileId = getContainingTileId(topLeftPoint,  zoomLevel, cacheParams);
  const bottomRightTileId = getContainingTileId(botRightPoint, zoomLevel, cacheParams);

  // TODO: I think this will actually happen, as tiles have a finite number of
  // pixels per side, so due to this granularity, a tile could in theory fall
  // exactly on the // viewport boundary. How should I handle that possibility??
  // Note, this also applies to the bottom right tile.
  assert(topLeftTileId.topLeftPoint.r <= topLeftPoint.r,
    'top left tile should partially overlap the viewport')
  assert(topLeftTileId.topLeftPoint.c >= topLeftPoint.c,
    'top left tile should partially overlap the viewport')

  const numRows = (topLeftTileId.gridCoord.y - bottomRightTileId.gridCoord.y) + 1;
  const numCols = (bottomRightTileId.gridCoord.x - topLeftTileId.gridCoord.x) + 1;

  return getTileGrid(topLeftTileId, numRows, numCols, cacheParams);
}

// ----------------------------------------------------------------------------

function getTileGrid(topLeftTileId, rows, cols, cacheParams) {
  const { gridCoord: topLeftCoord, zoomLevel } = topLeftTileId;
  const grid = [];

  for (let y=0; y<rows; y++) {
    let row = [];
    for (let x=0; x<cols; x++) {
      let gridCoord = {
         // moving from topLeft to topRight is positive in (real / x) dim
        x: topLeftCoord.x + x,
        // moving from topLeft to botLeft is negative in (complex / y) dim
        y: topLeftCoord.y - y,
      };
      row.push(createTileId(gridCoord, zoomLevel, cacheParams));
    }
    grid.push(row);
  }

  return grid;
}

// Starting in the upper right quadrant and moving clockwise, the grid coords
// for the 4 tiles near the origin are: [0, 0], [0, -1], [-1, -1], [-1, 0]
// This is determined by using Math.floor for positive component values and
// Math.ceil for negative component values.
function getContainingTileId(point, zoomLevel, cacheParams) {
  const sideLength = getSideLength(zoomLevel);
  let gridCoord = {
    x: Math.floor((point.r - TILE_ORIGIN.r) / sideLength),
    y: Math.floor((point.c - TILE_ORIGIN.c) / sideLength),
  };
  return createTileId(gridCoord, zoomLevel, cacheParams);
}

function createTileId(gridCoord, zoomLevel, cacheParams) {
  const sideLength = getSideLength(zoomLevel);
  const topLeftPoint = {
    r: gridCoord.x * sideLength,
    c: (gridCoord.y + 1) * sideLength,
  };
  return {
    gridCoord,
    topLeftPoint,
    sideLength,
    zoomLevel,
    cacheParams,
  };
}

// ----------------------------------------------------------------------------

export { getTileIds };
