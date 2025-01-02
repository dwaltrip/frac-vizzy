import { DeepReadonly } from '@/types';
import { Color, ComplexNum, Viewport } from '@/mandelbrot/types';

type pixels = number;

type ColoringAlgorithm = 'linear' | 'histogram';

interface ColorParams {
  algorithm: ColoringAlgorithm;
  color1: Color.RGB;
  color2: Color.RGB;
}

// TODO: split out different param types??
type RenderParamsData = {
  // --- viewport params ---
  center: ComplexNum;
  zoom: number;
  view: Viewport;

  // --- calculation params ---
  iters: number;
  // The size of the tile in pixels when zoom is an integer.
  // With smooth zoom, the rendered tiles are never this exact size.
  // There is always some fractional part of the zoom that we need to account for,
  //   which is done by scaling the tiles appropriately.
  // See the rendering code in `render-tile-data.ts` for more details.
  baseTileSizePx: pixels;

  // --- visualization params ---
  colors: ColorParams;
};

type RenderParamsUpdate =
  | { type: 'zoom'; value: number }
  | { type: 'center'; value: ComplexNum }
  | { type: 'iters'; value: number }
  | { type: 'colors'; value: Partial<ColorParams> }
  | { type: 'view'; value: Viewport };

type FrozenRenderParams = DeepReadonly<RenderParamsData>;

class RenderParams {
  center: ComplexNum;
  zoom: number;
  iters: number;

  colors: ColorParams;
  view: Viewport;

  baseTileSizePx: pixels;

  constructor(initial: RenderParamsData) {
    this.center = initial.center;
    this.zoom = initial.zoom;
    this.iters = initial.iters;

    this.colors = initial.colors;
    this.view = initial.view;

    this.baseTileSizePx = initial.baseTileSizePx;
  }

  asFrozen(): FrozenRenderParams {
    // TODO: use a deep copy to make this nicer
    return {
      center: { ...this.center },
      zoom: this.zoom,
      iters: this.iters,

      colors: { ...this.colors },
      view: { ...this.view },

      baseTileSizePx: this.baseTileSizePx,
    };
  }

  clone(): RenderParams {
    return new RenderParams(this.asFrozen());
  }
}

export {
  RenderParams,
  type RenderParamsData,
  type ColoringAlgorithm,
  type ColorParams,
  type RenderParamsUpdate,
  type FrozenRenderParams,
};
