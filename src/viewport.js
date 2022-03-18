
import { TILE_SIDE_LENGTH_IN_PIXELS } from './settings';
import { getSideLength } from './mandelbrot/calcs';

function getViewportInfo({ params, canvas }) {
  const { centerPos, zoomLevel } = params;

  const sideLength = getSideLength(zoomLevel);

  const rLen = (canvas.width / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;
  const cLen = (canvas.height / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;

  const topLeftPoint = {
    real: centerPos.r - (rLen / 2),
    complex: centerPos.c + (cLen / 2),
  };
  const botRightPoint = {
    real: topLeftPoint.real + rLen,
    complex: topLeftPoint.complex - cLen,
  };

  return {
    realLen: rLen,
    complexLen: cLen,
    topLeftPoint,
    botRightPoint,
    interPixelDistance: sideLength / TILE_SIDE_LENGTH_IN_PIXELS,

    height: canvas.height,
    width: canvas.width,
  };
}

export { getViewportInfo };
