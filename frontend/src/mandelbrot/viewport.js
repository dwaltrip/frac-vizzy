
import { TILE_SIDE_LENGTH_IN_PIXELS } from 'settings';
import { getSideLength } from 'mandelbrot/calcs';

function getViewportInfo(params, { height, width }) {
  const { centerPos, zoomLevel } = params;

  const sideLength = getSideLength(zoomLevel);

  const rLen = (width / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;
  const cLen = (height / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;

  const topLeftPoint = {
    r: centerPos.r - (rLen / 2),
    c: centerPos.c + (cLen / 2),
  };
  const botRightPoint = {
    r: topLeftPoint.r + rLen,
    c: topLeftPoint.c - cLen,
  };

  return {
    realLen: rLen,
    complexLen: cLen,
    topLeftPoint,
    botRightPoint,
    interPixelDistance: sideLength / TILE_SIDE_LENGTH_IN_PIXELS,

    height,
    width,
  };
}

export { getViewportInfo };
