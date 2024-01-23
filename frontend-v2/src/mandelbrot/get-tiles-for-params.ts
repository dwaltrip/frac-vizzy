import { FrozenRenderParams, Viewport, ZoomInfo } from '@/mandelbrot/types';
import { calculateVisibleTilesUsingUpscaling } from '@/mandelbrot/tile';
import { calcPixelToComplexUnitScale } from '@/mandelbrot/zoom';

function getTilesForParams(
  params: FrozenRenderParams,
  view: Viewport,
  defaultTileSizePx: number,
) {
  const zoom = params.zoom;
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
  const zoomInfo = createZoomInfo(zoom, renderedTileSizePx);

  return calculateVisibleTilesUsingUpscaling(zoomInfo, params.center, view);
}

function createZoomInfo(zoom: number, rawTileSizePx: number): ZoomInfo {
  const tileSizePx = rawTileSizePx;
  const pxToMath = calcPixelToComplexUnitScale(zoom);
  return {
    value: zoom,
    tileSizePx,
    tileSize: tileSizePx * pxToMath,
    pxToMath,
  };
}

export { getTilesForParams };
