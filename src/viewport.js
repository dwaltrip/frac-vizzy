
import { TILE_SIDE_LENGTH_IN_PIXELS } from './settings';

function getViewportInfo({ params, canvas }) {
  const { centerPos, zoomLevel } = params;

  const sideLength = 1 / Math.pow(2, zoomLevel);

  const realLen = (canvas.width / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;
  const complexLen = (canvas.height / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;

  const topLeftPoint = {
    real: centerPos.x - (realLen / 2),
    complex: centerPos.y + (complexLen / 2),
  };

  const interPixelDistance = realLen / canvas.width;

  return {
    realLen,
    complexLen,
    topLeftPoint,
    interPixelDistance:

    height: canvas.height,
    width: canvas.width,
  };
}

export { getViewportInfo };
