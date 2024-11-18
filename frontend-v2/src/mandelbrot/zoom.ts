import { assert } from '@/utils/assert';

import { RenderParamsLike } from '@/mandelbrot/params-manager';

const FIT_MOST_SCREENS_AT_ZOOM_LEVEL_0 = 50;
// TODO: Move this to more central location / settings file?
const TILE_SIZE_IN_PX = 64;

type PixelLen = number;
type ComplexLen = number;
type PixelsPerUnit = number;

class ZoomInfo {
  value: number;
  tileSizePx: number;
  tileSize: number;
  tileScaleFactor: number;
  private _pxToMath: number;

  constructor(
    value: number,
    tileSizePx: number,
    tileSize: number,
    pxToMath: number,
    tileScaleFactor: number,
  ) {
    this.value = value;
    this.tileSizePx = tileSizePx;
    this.tileSize = tileSize;
    this._pxToMath = pxToMath;
    this.tileScaleFactor = tileScaleFactor;
  }

  // --- DEPRECATED! --- (Add "deprecation warning"?)
  get pxToMath(): number {
    console.warn('pxToMath is deprecated. Use unitsPerPixel instead.');
    return this._pxToMath;
  }

  get renderedTileSizePx(): number {
    return this.tileSizePx * this.tileScaleFactor * this.unitsPerPixel;
  }

  get unitsPerPixel(): number {
    return this.pxToMath;
  }
}

function createZoomInfo(params: RenderParamsLike): ZoomInfo {
  const { zoom, defaultTileSizePx } = params;
  const tileSizeScaled = tileSizeScaledForFractionalZoom(
    zoom,
    defaultTileSizePx,
  );
  const unitsPerPixel = calcUnitsPerPixel(zoom);

  return new ZoomInfo(
    zoom,
    tileSizeScaled,
    tileSizeScaled * unitsPerPixel,
    unitsPerPixel,
    zoomScaleFactor(zoom),
  );
}

function zoomScaleFactor(zoom: number): number {
  return Math.pow(2, zoom - Math.floor(zoom));
}

function tileSizeScaledForFractionalZoom(
  zoom: number,
  defaultTileSizePx: number,
): PixelLen {
  const scale = zoomScaleFactor(zoom);
  const rawRenderedTileSizePx = defaultTileSizePx * scale;
  // We can (and MUST) use Math.round here as rawRenderedTileSizePx
  // should be incredibly close to an integer already.
  // In CanvasManger, we only call renderMandelbrot when we hit the next
  //   increment of tile sizes of integer dimensions.
  // Due to floating point rounding issues, Math.floor won't work here.
  // Refactor to make this more obvious / skip converting back and forth
  //   between zoom levels and tile sizes extra times?
  return Math.round(rawRenderedTileSizePx);
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

function calcUnitsPerPixel(zoomLevel: number): PixelsPerUnit {
  return 1 / (Math.pow(2, zoomLevel) * FIT_MOST_SCREENS_AT_ZOOM_LEVEL_0);
}

function tileSizeInComplexUnits(zoomLevel: number): ComplexLen {
  return TILE_SIZE_IN_PX * calcUnitsPerPixel(zoomLevel);
}

function calcPixelToComplexUnitScale(zoomLevel: number): PixelsPerUnit {
  console.warn(
    'calcPixelToComplexUnitScale is deprecated. Use calcUnitsPerPixel instead.',
  );
  return calcUnitsPerPixel(zoomLevel);
}

export {
  createZoomInfo,
  calcUnitsPerPixel,
  calcPixelToComplexUnitScale,
  tileSizeInComplexUnits,
  TILE_SIZE_IN_PX,
  type PixelLen,
  tileSizeScaledForFractionalZoom,
  calcFractionalZoomFromScaledTileSize,
};
