
import { TILE_SIDE_LENGTH_IN_PIXELS } from './settings';

function getViewportInfo({ params, canvas }) {
  const { centerPos, zoomLevel } = params;

  const sideLength = 1 / Math.pow(2, zoomLevel);

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

  // This should be exactly the same as `cLen / cavns.height`
  // Or `TILE_SIDE_LENGTH_IN_PIXELS / sideLength`...
  const interPixelDistance = rLen / canvas.width;

  return {
    realLen: rLen,
    complexLen: cLen,
    topLeftPoint,
    botRightPoint,
    interPixelDistance,

    height: canvas.height,
    width: canvas.width,
  };
}

export { getViewportInfo };
