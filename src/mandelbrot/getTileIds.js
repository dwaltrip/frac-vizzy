
const TILE_ORIGIN = { real: 0, complex: 0 };

function getTileIds({ realRange, complexRange, zoomLevel }) {
  const sideLength = 1 / Math.pow(2, zoomLevel);

  const topLeftPoint = {
    // topLeft is start of real range and the end of the complex range
    real: realRange.start,
    complex: complexRange.end,
  };
  const botRightPoint = {
    real: realRange.end,
    complex: complexRange.start,
  };

  const topLeftTileId = getContainingTileId(topLeftPoint, sideLength);
  const bottomRightTileId = getContainingTileId(botRightPoint, sideLength);

  const numRows = (topLeftTileId.gridCoord.complex - bottomRightTileId.gridCoord.complex) + 1;
  const numCols = (bottomRightTileId.gridCoord.real - topLeftTileId.gridCoord.real) + 1;

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
          real: topLeftCoord.real + x,
          // moving from topLeft to botLeft is negative in (complex / y) dim
          complex: topLeftCoord.complex - y,
        },
        sideLength: topLeftTileId.sideLength,
      });
    }
    grid.push(row);
  }

  return grid;
}

// Starting in the upper left quadrant and moving clockwise, the grid coords
// for the 4 tiles near the origin are: [0, 0], [0, -1], [-1, -1], [-1, 0]
// This is determined by using Math.floor for positive component values and
// Math.ceil for negative component values.
function getContainingTileId(point, sideLength) {
  return {
    gridCoord: {
      real: Math.floor((point.real - TILE_ORIGIN.real) / sideLength),
      complex: Math.floor((point.complex - TILE_ORIGIN.complex) / sideLength),
    },
    sideLength,
  };
}

function getNearestTileSideLengthLessThan(distance) {
  let sideLength = 1;  
  while (sideLength > distance) {
    sideLength = sideLength / 2;
  }
  return sideLength;
}
