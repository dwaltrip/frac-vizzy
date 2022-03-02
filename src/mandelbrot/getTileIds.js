
import { TILE_SIDE_LENGTH_IN_PIXELS } from '../settings';

const TILE_ORIGIN = { real: 0, complex: 0 };

// ----------------------------------------------------------------------------

function getTileIds({ centerPos, viewport, zoomLevel }) {
  const sideLength = 1 / Math.pow(2, zoomLevel);

  const xLen = (viewport.width / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;
  const yLen = (viewport.height / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;

  const topLeftPoint = {
    real: centerPos.x - (xLen / 2),
    complex: centerPos.y + (yLen / 2),
  };
  const botRightPoint = {
    real: centerPos.x + (xLen / 2),
    complex: centerPos.y - (yLen / 2),
  };

  const topLeftTileId = getContainingTileId(topLeftPoint, sideLength);
  const bottomRightTileId = getContainingTileId(botRightPoint, sideLength);

  const numRows = (topLeftTileId.gridCoord.y - bottomRightTileId.gridCoord.y) + 1;
  const numCols = (bottomRightTileId.gridCoord.x - topLeftTileId.gridCoord.x) + 1;

  return getTileGrid(topLeftTileId, numRows, numCols);
}

// ----------------------------------------------------------------------------

function getTileGrid(topLeftTileId, rows, cols) {
  let topLeftCoord = topLeftTileId.gridCoord;
  let grid = [];

  for (let y=0; y<rows; y++) {
    let row = [];
    for (let x=0; x<cols; x++) {
      row.push({
        gridCoord: {
          // moving from topLeft to topRight is positive in (real / x) dim
          x: topLeftCoord.x + x,
          // moving from topLeft to botLeft is negative in (complex / y) dim
          y: topLeftCoord.y - y,
        },
        sideLength: topLeftTileId.sideLength,
      });
    }
    grid.push(row);
  }

  return grid;
}

// Starting in the upper right quadrant and moving clockwise, the grid coords
// for the 4 tiles near the origin are: [0, 0], [0, -1], [-1, -1], [-1, 0]
// This is determined by using Math.floor for positive component values and
// Math.ceil for negative component values.
function getContainingTileId(point, sideLength) {
  return {
    gridCoord: {
      x: Math.floor((point.real - TILE_ORIGIN.real) / sideLength),
      y: Math.floor((point.complex - TILE_ORIGIN.complex) / sideLength),
    },
    sideLength,
  };
}
