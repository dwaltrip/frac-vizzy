import { DeepReadonly } from '@/types';
import { ComplexNum, Viewport } from '@/mandelbrot/types';

type pixels = number;

type RenderParamsData = {
  center: ComplexNum;
  zoom: number;
  iters: number;

  tileSizePx: pixels;
  view: Viewport;
};

type FrozenRenderParams = DeepReadonly<RenderParamsData>;

class RenderParams {
  center: ComplexNum;
  zoom: number;
  iters: number;
  tileSizePx: pixels;
  view: Viewport;

  constructor(initial: RenderParamsData) {
    this.center = initial.center;
    this.zoom = initial.zoom;
    this.iters = initial.iters;
    this.tileSizePx = initial.tileSizePx;
    this.view = initial.view;
  }

  asFrozen(): FrozenRenderParams {
    return {
      center: this.center,
      zoom: this.zoom,
      iters: this.iters,
      tileSizePx: this.tileSizePx,
      view: this.view,
    };
  }

  clone(): RenderParams {
    return new RenderParams(this.asFrozen());
  }
}

export { RenderParams, type RenderParamsData, type FrozenRenderParams };
