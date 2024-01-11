import { assert } from '@/utils/assert';

const FIT_MOST_SCREENS_AT_ZOOM_LEVEL_0 = 50;
const TILE_SIZE_IN_PX = 64;

type PixelLen = number;
type ComplexLen = number;
type PixelToComplexLen = number;

function tileSizeFromZoom(zoom: number): PixelLen {
  const scale = Math.pow(2, zoom - Math.floor(zoom));
  return TILE_SIZE_IN_PX * scale;
}

function calcFractionalZoomFromScaledTileSize(
  renderedTileSizePx: PixelLen,
): number {
  assert(
    Number.isInteger(renderedTileSizePx),
    'renderedTileSizePx must be an integer',
  );
  return Math.log2(renderedTileSizePx / TILE_SIZE_IN_PX);
}

function calcPixelToComplexUnitScale(zoomLevel: number): PixelToComplexLen {
  return 1 / (Math.pow(2, zoomLevel) * FIT_MOST_SCREENS_AT_ZOOM_LEVEL_0);
}

function tileSizeInComplexUnits(zoomLevel: number): ComplexLen {
  return TILE_SIZE_IN_PX * calcPixelToComplexUnitScale(zoomLevel);
}

export {
  calcPixelToComplexUnitScale,
  tileSizeInComplexUnits,
  TILE_SIZE_IN_PX,
  tileSizeFromZoom,
  calcFractionalZoomFromScaledTileSize,
};
