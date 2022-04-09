import { TILE_SIDE_LENGTH_IN_PIXELS } from '../settings';

// These points draw a box around the fully zoomed out Mandelbrot
const DEFAULT_TOP_LEFT = { r: -1.5, c: 1.2 };
const DEFAULT_BOT_RIGHT = { r: 0.5, c: -1.2 };

function getSideLength(zoomLevel) {
  return 1 / Math.pow(2, zoomLevel);
}

// Compute default zoom level so the entire Mandelbrot fits in image
function getInitialZoomLevel(viewport) {
  const rLen = DEFAULT_BOT_RIGHT.r - DEFAULT_TOP_LEFT.r;
  const cLen = DEFAULT_TOP_LEFT.c - DEFAULT_BOT_RIGHT.c;

  const tileGrid = {
    height: Math.ceil(viewport.height / TILE_SIDE_LENGTH_IN_PIXELS),
    width: Math.ceil(viewport.width / TILE_SIDE_LENGTH_IN_PIXELS),
  };

  // TODO: would be nice to have a test for this logic
  const zoomLevelFromR = Math.floor(-1 * Math.log2(rLen / tileGrid.width));
  const zoomLevelFromC = Math.floor(-1 * Math.log2(cLen / tileGrid.height));

  return Math.min(zoomLevelFromR, zoomLevelFromC);
}

export {
  getSideLength,
  getInitialZoomLevel,
};
