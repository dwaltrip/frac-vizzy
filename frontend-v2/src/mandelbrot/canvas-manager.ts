// import { logNow } from '@/lib/misc';
import { perfStats } from '@/lib/perf-stats';

import {
  ComplexNum,
  FrozenRenderParams,
  MousePos,
  Viewport,
} from '@/mandelbrot/types';
import { DEFAULT_PARAMS } from '@/mandelbrot/constants';
import { renderMandelbrot } from '@/mandelbrot/render-mandelbrot';
import {
  TILE_SIZE_IN_PX,
  calcPixelToComplexUnitScale,
  tileSizeFromZoom,
  calcFractionalZoomFromScaledTileSize,
} from '@/mandelbrot/zoom';

import { deepClone } from '@/utils/deep-clone';

// TODO: this should be dynamically determined and updated on window resize
const CONTAINER_SIZE = { width: 1000, height: 700 };

class CanvasManager {
  // TODO: encapsulate drag specific stuff??
  isSetup: boolean = false;
  isDragging: boolean = false;
  mousePos: MousePos | null = null;

  canvas: HTMLCanvasElement;
  container: HTMLElement;

  // TODO: default param values should be managed elsewhere
  private _params: FrozenRenderParams =
    RenderParams.getDefaultParams().asFrozen();
  private _nextParams: RenderParams = RenderParams.fromFrozen(this._params);

  private _isWaitingToRender: boolean = false;
  private _eventHandlers: EventHandlers;
  private _removeEventListeners: (() => void) | null = null;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.container = container;

    container.style.width = `${CONTAINER_SIZE.width}px`;
    container.style.height = `${CONTAINER_SIZE.height}px`;
    canvas.width = CONTAINER_SIZE.width;
    canvas.height = CONTAINER_SIZE.height;

    this._eventHandlers = {
      mousedown: (event: MouseEvent) => {
        const rect: DOMRect = canvas.getBoundingClientRect();
        this.mousePos = getMousePos(rect, event);
        this.isDragging = true;
      },

      mouseup: () => {
        this.isDragging = false;
      },

      mousemove: (event: MouseEvent) => {
        if (this.isDragging && this.mousePos) {
          const rect: DOMRect = canvas.getBoundingClientRect();
          const newPos = getMousePos(rect, event);
          const moveAmount = {
            x: this.mousePos.x - newPos.x,
            y: this.mousePos.y - newPos.y,
          };
          this.mousePos = newPos;
          this._nextParams.moveCenter(moveAmount.x, moveAmount.y);
          this.queueRender();
        }
      },

      mouseleave: () => {
        this.isDragging = false;
      },

      wheel: (event: WheelEvent) => {
        event.preventDefault();
        const zoomAmt = event.deltaY * -0.01;
        const pos = getMousePos(canvas.getBoundingClientRect(), event);
        // logNow(`wheel -- zoomAmt: ${zoomAmt} -- mouse: (${pos.x}, ${pos.y})`);
        this.performZoom(zoomAmt, pos);
      },
    };
  }

  get params(): FrozenRenderParams {
    return this._params;
  }

  performZoom(zoomChange: number, mousePos: MousePos) {
    // logNow(`performZoom -- change: ${zoomChange} -- pos: (${mousePos.x}, ${mousePos.y})`);
    const canvas = this.canvas;

    const prevSizeInt = Math.floor(tileSizeFromZoom(this._params.zoom));
    // TODO: Better name for this?
    //  Or way to indicate / enforce integer value? With types?
    const prevZoomLevel = Math.floor(this._params.zoom);

    this._nextParams.updateZoom(zoomChange);

    const nextSizeInt = Math.round(tileSizeFromZoom(this._nextParams.zoom));
    const nextZoomLevel = Math.floor(this._nextParams.zoom);

    const isAtSameZoomLevel = nextZoomLevel === prevZoomLevel;
    const haveZoomedByLessThanOnePx = Math.abs(nextSizeInt - prevSizeInt) < 1;
    // Only render once we've zoomed in at least 1 pixel
    if (isAtSameZoomLevel && haveZoomedByLessThanOnePx) {
      return;
    }

    // Render tile size with integer dimensions
    let targetZooom =
      nextZoomLevel + calcFractionalZoomFromScaledTileSize(nextSizeInt);
    const isEpsilonAwayFromNearestInt =
      Math.abs(targetZooom - Math.round(targetZooom)) < Number.EPSILON;
    // This epislon check is needed to prevent floating point issues.
    // Otherwise, it can get stuck at zoom=3.999999999, as an example.
    this._nextParams.zoom = isEpsilonAwayFromNearestInt
      ? Math.round(targetZooom)
      : targetZooom;
    // Keep mouse pos stationary relative to the the fractal
    this._nextParams.center = findCenterToKeepMousePosStationary(
      mousePos,
      { old: this._params.zoom, new: this._nextParams.zoom },
      this._params.center,
      { width: canvas.width, height: canvas.height },
    );

    this.queueRender();
  }

  setup(): void {
    for (const [event, handler] of Object.entries(this._eventHandlers)) {
      this.canvas.addEventListener(event, handler);
    }
    this._removeEventListeners = () => {
      for (const [event, handler] of Object.entries(this._eventHandlers)) {
        this.canvas.removeEventListener(event, handler);
      }
    };

    this.isSetup = true;
    this.queueRender();
  }

  cleanup(): void {
    if (!this.isSetup) {
      console.warn('Cleanup called before setup');
      return;
    }
    this._removeEventListeners!();
  }

  getCtx(): CanvasRenderingContext2D {
    if (!this.canvas) throw new Error('Canvas not available');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');
    return ctx;
  }

  queueRender() {
    if (this._isWaitingToRender) {
      return;
    }
    window.requestAnimationFrame(() => this._render());
    this._isWaitingToRender = true;
  }

  async _render() {
    const params = this._nextParams.asFrozen();
    const canvas = this.canvas;
    const tileSizePx = TILE_SIZE_IN_PX;

    perfStats.resetStats('pointsToBitmap');
    perfStats.resetStats('computeTile');
    perfStats.resetStats('ctx.drawImage');
    await renderMandelbrot(canvas, params, tileSizePx);
    // perfStats.logAllStats('\t');
    perfStats.logStats('pointsToBitmap', '\t');
    // perfStats.logStats('computeTile', '\t');
    // perfStats.logStats('ctx.drawImage', '\t');

    this._params = params;
    this._isWaitingToRender = false;
  }
}

class RenderParams {
  center: ComplexNum;
  zoom: number;

  constructor(center: ComplexNum, zoom: number) {
    this.center = center;
    this.zoom = zoom;
  }

  static getDefaultParams(): RenderParams {
    // NOTE: Typescript doesn't catch passing readonly into mutable...
    // So we gotta use deepClone.
    const { center, zoom }: { center: ComplexNum; zoom: number } =
      deepClone(DEFAULT_PARAMS);
    return new RenderParams(center, zoom);
  }

  moveCenter(dx: number, dy: number): void {
    const pxToMath = calcPixelToComplexUnitScale(this.zoom);
    const movement = { re: dx * pxToMath, im: dy * pxToMath };
    this.center.re += movement.re;
    this.center.im -= movement.im;
  }

  updateZoom(amountToAdd: number): void {
    this.zoom = clamp(this.zoom + amountToAdd, 0, 40);
  }

  asFrozen(): FrozenRenderParams {
    const params: FrozenRenderParams = { center: this.center, zoom: this.zoom };
    return params;
  }

  static fromFrozen(params: FrozenRenderParams): RenderParams {
    return new RenderParams(params.center, params.zoom);
  }
}

interface EventHandlers {
  mousedown: (event: MouseEvent) => void;
  mouseup: (event: MouseEvent) => void;
  mousemove: (event: MouseEvent) => void;
  mouseleave: (event: MouseEvent) => void;
  wheel: (event: WheelEvent) => void;
}

const getMousePos = (rect: DOMRect, event: MouseEvent): MousePos => ({
  x: event.clientX - rect.left,
  y: event.clientY - rect.top,
});

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export { CanvasManager };
