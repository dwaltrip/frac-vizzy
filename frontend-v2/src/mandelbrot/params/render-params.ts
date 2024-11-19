import { DeepReadonly } from '@/types';
import { ComplexNum, Viewport } from '@/mandelbrot/types';

type pixels = number;

type RenderParamsData = {
  center: ComplexNum;
  zoom: number;
  iters: number;

  // The size of the tile in pixels when zoom is an integer.
  // With smooth zoom, the rendered tiles are never this exact size.
  // There is always some fractional part of the zoom that we need to account for,
  //   which is done by scaling the tiles appropriately.
  // See the rendering code in `render-tile-data.ts` for more details.
  baseTileSizePx: pixels;
  view: Viewport;
};

type FrozenRenderParams = DeepReadonly<RenderParamsData>;

class RenderParams {
  center: ComplexNum;
  zoom: number;
  iters: number;
  baseTileSizePx: pixels;
  view: Viewport;

  constructor(initial: RenderParamsData) {
    this.center = initial.center;
    this.zoom = initial.zoom;
    this.iters = initial.iters;
    this.baseTileSizePx = initial.baseTileSizePx;
    this.view = initial.view;
  }

  asFrozen(): FrozenRenderParams {
    return {
      center: this.center,
      zoom: this.zoom,
      iters: this.iters,
      baseTileSizePx: this.baseTileSizePx,
      view: this.view,
    };
  }

  clone(): RenderParams {
    return new RenderParams(this.asFrozen());
  }
}

export { RenderParams, type RenderParamsData, type FrozenRenderParams };
