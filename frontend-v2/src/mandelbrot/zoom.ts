import { assert } from '@/utils/assert';

const FIT_MOST_SCREENS_AT_ZOOM_LEVEL_0 = 50;
// TODO: Move this to more central location / settings file?
const TILE_SIZE_IN_PX = 64;

type PixelLen = number;
type ComplexLen = number;
type PixelsPerUnit = number;

class ZoomInfo {
  value: number;
  tileSize: ComplexLen;
  TILE_SIZE_IN_PX: PixelLen;
  tileSizePxScaled: PixelLen;
  unitsPerPixel: number;
  scaleFactor: number;

  constructor(zoomValue: number) {
    this.value = zoomValue;
    this.TILE_SIZE_IN_PX = TILE_SIZE_IN_PX;

    this.unitsPerPixel = calcUnitsPerPixel(zoomValue);
    this.scaleFactor = zoomScaleFactor(zoomValue);

    this.tileSizePxScaled = tileSizePxScaledForFractionalZoom(
      zoomValue,
      TILE_SIZE_IN_PX,
    );
    this.tileSize = this.tileSizePxScaled * this.unitsPerPixel;
  }

  get integerPartOfZoom(): number {
    // TODO: any issue with values like 3.9999999 ?
    return Math.floor(this.value);
  }
}

function createZoomInfo(zoom: number): ZoomInfo {
  return new ZoomInfo(zoom);
}

function zoomScaleFactor(zoom: number): number {
  return Math.pow(2, zoom - Math.floor(zoom));
}

function tileSizePxScaledForFractionalZoom(
  zoom: number,
  defaultTileSizePx: PixelLen,
): PixelLen {
  const scale = zoomScaleFactor(zoom);
  const rawScaledTileSizePx = defaultTileSizePx * scale;
  // We can (and MUST) use Math.round here as rawScaledTileSizePx
  // should be incredibly close to an integer already.
  // In CanvasManger, we only call renderMandelbrot when we hit the next
  //   increment of tile sizes of integer dimensions.
  // Due to floating point rounding issues, Math.floor won't work here.
  // Refactor to make this more obvious / skip converting back and forth
  //   between zoom levels and tile sizes extra times?
  return Math.round(rawScaledTileSizePx);
}

function calcFractionalZoomFromScaledTileSize(
  tileSizePxScaled: PixelLen,
): number {
  assert(
    Number.isInteger(tileSizePxScaled),
    'tileSizePxScaled must be an integer',
  );
  return Math.log2(tileSizePxScaled / TILE_SIZE_IN_PX);
}

function calcUnitsPerPixel(zoomLevel: number): PixelsPerUnit {
  // FIT_MOST_SCREENS_AT_ZOOM_LEVEL_0 could be any nubmer, as long as it's constant.
  // The current value seems to fit the initial zoomed-out Mandelbrot on most screens.
  return 1 / (Math.pow(2, zoomLevel) * FIT_MOST_SCREENS_AT_ZOOM_LEVEL_0);
}

export {
  type PixelLen,
  TILE_SIZE_IN_PX,
  createZoomInfo,
  calcUnitsPerPixel,
  calcFractionalZoomFromScaledTileSize,
};
