import {
  ComplexNum,
  FrozenRenderParams,
  MousePos,
  Viewport,
} from '@/mandelbrot/types';

import { getMousePos } from '@/mandelbrot/utils/get-mouse-pos';
import { ParamsManager } from '@/mandelbrot/params-manager';
import {
  calcPixelToComplexUnitScale,
  tileSizeFromZoom,
  calcFractionalZoomFromScaledTileSize,
} from '@/mandelbrot/zoom';

class InteractionManager {
  private isDragging: boolean = false;
  private mousePos: MousePos | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private paramsManager: ParamsManager,
    private onParamsUpdate: (params: FrozenRenderParams) => void,
  ) {
    this.canvas = canvas;
    this.paramsManager = paramsManager;
    this.onParamsUpdate = onParamsUpdate;

    this.attachEventListeners();
  }

  get params() {
    return this.paramsManager.current;
  }
  get targetParams() {
    return this.paramsManager.target;
  }

  private handleMouseDown = (event: MouseEvent) => {
    const rect: DOMRect = this.canvas.getBoundingClientRect();
    // TODO: rename mousePos to mouseDownPos (or something like that?)
    // maybe `panMousePos`?
    this.mousePos = getMousePos(rect, event);
    this.isDragging = true;
  };

  private handleMouseUp = () => {
    this.isDragging = false;
  };

  private handleMouseLeave = () => {
    this.isDragging = false;
  };

  private handleMouseMove = (event: MouseEvent) => {
    if (this.isDragging && this.mousePos) {
      const rect: DOMRect = this.canvas.getBoundingClientRect();
      const newPos = getMousePos(rect, event);
      const moveAmount = {
        x: this.mousePos.x - newPos.x,
        y: this.mousePos.y - newPos.y,
      };
      this.mousePos = newPos;
      this.targetParams.moveCenter(moveAmount.x, moveAmount.y);
      this.onParamsUpdate(this.targetParams.asFrozen());
    }
  };

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const zoomAmt = event.deltaY * -0.01;
    const pos = getMousePos(this.canvas.getBoundingClientRect(), event);
    // logNow(`wheel -- zoomAmt: ${zoomAmt} -- mouse: (${pos.x}, ${pos.y})`);
    this.performZoom(zoomAmt, pos);
  };

  // TODO: This is complicated. Can we simplify? Or add tests?
  performZoom(zoomChange: number, mousePos: MousePos) {
    // logNow(`performZoom -- change: ${zoomChange} -- pos: (${mousePos.x}, ${mousePos.y})`);
    const canvas = this.canvas;

    const prevSizeInt = Math.floor(tileSizeFromZoom(this.params.zoom));
    // TODO: Better name for this?
    //  Or way to indicate / enforce integer value? With types?
    const prevZoomLevel = Math.floor(this.params.zoom);

    this.targetParams.updateZoom(zoomChange);

    const nextSizeInt = Math.round(tileSizeFromZoom(this.targetParams.zoom));
    const nextZoomLevel = Math.floor(this.targetParams.zoom);

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
    this.targetParams.setZoom(
      isEpsilonAwayFromNearestInt ? Math.round(targetZooom) : targetZooom,
    );

    // Keep mouse pos stationary relative to the the fractal
    this.targetParams.setCenter(
      findCenterToKeepMousePosStationary(
        mousePos,
        { old: this.params.zoom, new: this.targetParams.zoom },
        this.params.center,
        { width: canvas.width, height: canvas.height },
      ),
    );

    this.onParamsUpdate(this.targetParams.asFrozen());
  }

  attachEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('wheel', this.handleWheel);
  }

  detachEventListeners() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('wheel', this.handleWheel);
  }
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

export { InteractionManager };
