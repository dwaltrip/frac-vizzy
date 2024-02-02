import { ParamsManager } from '@/mandelbrot/params-manager';
import { ComplexNum, MousePos, Viewport } from '@/mandelbrot/types';
import {
  calcFractionalZoomFromScaledTileSize,
  calcPixelToComplexUnitScale,
  tileSizeFromZoom,
} from '@/mandelbrot/zoom';

// This only modifies the params, doesn't render anything
function performZoom(
  paramsManager: ParamsManager,
  zoomChange: number,
  mousePos: MousePos,
  view: Viewport,
) {
  const params = paramsManager.current;
  const targetParams = paramsManager.target;

  const prevSizeInt = Math.floor(tileSizeFromZoom(params.zoom));
  // TODO: Better name for this?
  //  Or way to indicate / enforce integer value? With types?
  const prevZoomLevel = Math.floor(params.zoom);

  targetParams.updateZoom(zoomChange);

  const nextSizeInt = Math.round(tileSizeFromZoom(targetParams.zoom));
  const nextZoomLevel = Math.floor(targetParams.zoom);

  const isAtSameZoomLevel = nextZoomLevel === prevZoomLevel;
  const haveZoomedByLessThanOnePx = Math.abs(nextSizeInt - prevSizeInt) < 1;
  // Only render once we've zoomed in at least 1 pixel
  if (isAtSameZoomLevel && haveZoomedByLessThanOnePx) {
    return;
  }

  // Render tile size with integer dimensions
  let targetZooom =
    nextZoomLevel + calcFractionalZoomFromScaledTileSize(nextSizeInt);
  // This epislon check is needed to prevent floating point issues.
  // Otherwise, it can get stuck at zoom=3.999999999, as an example.
  const isEpsilonAwayFromNearestInt =
    Math.abs(targetZooom - Math.round(targetZooom)) < Number.EPSILON;
  targetParams.setZoom(
    isEpsilonAwayFromNearestInt ? Math.round(targetZooom) : targetZooom,
  );

  // Keep mouse pos stationary relative to the the fractal
  targetParams.setCenter(
    findCenterToKeepMousePosStationary(
      mousePos,
      { old: params.zoom, new: targetParams.zoom },
      params.center,
      view,
    ),
  );

  // this.onParamsUpdate(this.targetParams.asFrozen());
}

function findCenterToKeepMousePosStationary(
  mousePos: MousePos,
  zoom: { old: number; new: number },
  oldCenter: ComplexNum,
  view: Viewport,
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

  const newPxToMath = calcPixelToComplexUnitScale(zoom.new);
  const adjustment = {
    re: pxDelta.x * newPxToMath,
    im: pxDelta.y * newPxToMath,
  };

  return {
    re: oldCenter.re + adjustment.re,
    im: oldCenter.im - adjustment.im,
  };
}

export { performZoom };
