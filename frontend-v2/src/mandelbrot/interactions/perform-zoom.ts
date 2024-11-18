import { clamp } from '@/utils/clamp';
import { ComplexNum, MousePos, Viewport } from '@/mandelbrot/types';
import {
  RenderParams,
  FrozenRenderParams,
} from '@/mandelbrot/params/render-params';
import {
  calcFractionalZoomFromScaledTileSize,
  calcUnitsPerPixel,
  PixelLen,
  TILE_SIZE_IN_PX,
} from '@/mandelbrot/zoom';

// This only modifies the params, doesn't render anything
function performZoom(
  renderedParams: FrozenRenderParams,
  zoomChange: number,
  mousePos: MousePos,
): RenderParams | null {
  const target = new RenderParams(renderedParams);
  const view = renderedParams.view;

  // -----------------------------------------------------------------------------------------------------
  // TODO: why are we flooring here instead of rounding, like I do in `tileSizeScaledForFractionalZoom`???
  // Why do I have this separate approach, `tileSizeFromZoom`??
  // -----------------------------------------------------------------------------------------------------
  const prevSizeInt = Math.floor(tileSizeFromZoom(renderedParams.zoom));

  // TODO: Better name for this?
  //  Or way to indicate / enforce integer value? With types?
  const prevZoomLevel = Math.floor(renderedParams.zoom);

  target.zoom = zoomAdd(target, zoomChange);

  const nextSizeInt = Math.round(tileSizeFromZoom(target.zoom));
  const nextZoomLevel = Math.floor(target.zoom);

  const isAtSameZoomLevel = nextZoomLevel === prevZoomLevel;
  const haveZoomedByLessThanOnePx = Math.abs(nextSizeInt - prevSizeInt) < 1;
  // Only render once we've zoomed in at least 1 pixel
  if (isAtSameZoomLevel && haveZoomedByLessThanOnePx) {
    return null;
  }

  // Render tile size with integer dimensions
  let rawTargetZooom =
    nextZoomLevel + calcFractionalZoomFromScaledTileSize(nextSizeInt);
  // This epislon check is needed to prevent floating point issues.
  // Otherwise, it can get stuck at zoom=3.999999999, as an example.
  target.zoom = roundIfIsEpsilonDistFromInt(rawTargetZooom);

  // Keep mouse pos stationary relative to the the fractal
  target.center = findCenterToKeepMousePosStationary(
    renderedParams.center,
    { old: renderedParams.zoom, new: target.zoom },
    view,
    mousePos,
  );

  return target;
}

function tileSizeFromZoom(zoom: number): PixelLen {
  const scale = Math.pow(2, zoom - Math.floor(zoom));
  return TILE_SIZE_IN_PX * scale;
}

function zoomAdd(params: RenderParams, amount: number): number {
  return clamp(params.zoom + amount, 0, 40);
}

function roundIfIsEpsilonDistFromInt(num: number): number {
  // --------------------------------------------------------------------
  // TODO: Is it even possible for this to happen?? Did I ever test this?
  // --------------------------------------------------------------------
  const isEpsilonAwayFromInt = Math.abs(num - Math.round(num)) < Number.EPSILON;
  return isEpsilonAwayFromInt ? Math.round(num) : num;
}

function findCenterToKeepMousePosStationary(
  oldCenter: ComplexNum,
  zoom: { old: number; new: number },
  view: Viewport,
  mousePos: MousePos,
): ComplexNum {
  const centerPos = {
    x: view.width / 2,
    y: view.height / 2,
  };
  const vec = {
    x: mousePos.x - centerPos.x,
    y: mousePos.y - centerPos.y,
  };
  const scale = Math.pow(2, zoom.new - zoom.old);
  const newVec = {
    x: vec.x * scale,
    y: vec.y * scale,
  };
  const pxDelta = {
    x: newVec.x - vec.x,
    y: newVec.y - vec.y,
  };

  const unitsPerPixelNew = calcUnitsPerPixel(zoom.new);
  const adjustment = {
    re: pxDelta.x * unitsPerPixelNew,
    im: pxDelta.y * unitsPerPixelNew,
  };

  return {
    re: oldCenter.re + adjustment.re,
    im: oldCenter.im - adjustment.im,
  };
}

export { performZoom };
