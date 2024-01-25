import { assert } from '@/utils/assert';

import { RenderParamsLike } from '@/mandelbrot/params-manager';

const FIT_MOST_SCREENS_AT_ZOOM_LEVEL_0 = 50;
const TILE_SIZE_IN_PX = 64;

type PixelLen = number;
type ComplexLen = number;
type PixelsPerUnit = number;

class ZoomInfo {
  value: number;
  tileSizePx: number;
  tileSize: number;
  _pxToMath: number;

  constructor(
    value: number,
    tileSizePx: number,
    tileSize: number,
    pxToMath: number,
  ) {
    this.value = value;
    this.tileSizePx = tileSizePx;
    this.tileSize = tileSize;
    this._pxToMath = pxToMath;
  }

  // --- DEPRECATED! --- (Add "deprecation warning"?)
  get pxToMath(): number {
    return this._pxToMath;
  }

  get unitsPerPixel(): number {
    return this.pxToMath;
  }
}

function createZoomInfo(params: RenderParamsLike): ZoomInfo {
  const { zoom, defaultTileSizePx } = params;
  const scaleAmount = Math.pow(2, zoom - Math.floor(zoom));
  const rawRenderedTileSizePx = defaultTileSizePx * scaleAmount;

  // We can (and MUST) use Math.round here as rawRenderedTileSizePx
  // should be incredibly close to an integer already.
  // In CanvasManger, we only call renderMandelbrot when we hit the next
  //   increment of tile sizes of integer dimensions.
  // Due to floating point rounding issues, Math.floor won't work here.
  // Refactor to make this more obvious / skip converting back and forth
  //   between zoom levels and tile sizes extra times?
  const renderedTileSizePx = Math.round(rawRenderedTileSizePx);
  const pxToMath = calcPixelToComplexUnitScale(zoom);

  return new ZoomInfo(
    zoom,
    renderedTileSizePx,
    renderedTileSizePx * pxToMath,
    pxToMath,
  );
}

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

function calcPixelToComplexUnitScale(zoomLevel: number): PixelsPerUnit {
  return 1 / (Math.pow(2, zoomLevel) * FIT_MOST_SCREENS_AT_ZOOM_LEVEL_0);
}

function tileSizeInComplexUnits(zoomLevel: number): ComplexLen {
  return TILE_SIZE_IN_PX * calcPixelToComplexUnitScale(zoomLevel);
}

export {
  createZoomInfo,
  calcPixelToComplexUnitScale,
  tileSizeInComplexUnits,
  TILE_SIZE_IN_PX,
  tileSizeFromZoom,
  calcFractionalZoomFromScaledTileSize,
};
