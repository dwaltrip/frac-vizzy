import { TILE_SIDE_LENGTH_IN_PIXELS, BOUNDING_BOX } from 'settings';

function getSideLength(zoomLevel) {
  return 1 / Math.pow(2, zoomLevel);
}

// Compute default zoom level so the entire Mandelbrot fits in image
function getInitialZoomLevel(viewport) {
  const { topLeft, botRight } = BOUNDING_BOX;

  const MARGIN = 1.05; // 5% margin
  const rLen = (botRight.r - topLeft.r) * MARGIN;
  const cLen = (topLeft.c - botRight.c) * MARGIN;

  const numTiles = {
    x: viewport.width / TILE_SIDE_LENGTH_IN_PIXELS,
    y: viewport.height / TILE_SIDE_LENGTH_IN_PIXELS,
  };
  const zoomLevelFromR = Math.floor(Math.log2(1 / (rLen / numTiles.x)));
  const zoomLevelFromC = Math.floor(Math.log2(1 / (cLen / numTiles.y)));

  return Math.min(zoomLevelFromR, zoomLevelFromC);
}

export {
  getSideLength,
  getInitialZoomLevel,
};
