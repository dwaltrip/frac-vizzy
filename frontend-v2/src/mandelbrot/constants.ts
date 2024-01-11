import { BBox, FrozenRenderParams } from '@/mandelbrot/types';

const DEFAULT_PARAMS: FrozenRenderParams = {
  // center: { re: -0.94, im: 0.3615 }, zoom: 6,
  center: { re: -0.5, im: 0 },
  zoom: 2,
};

const MANDELBROT_BBOX: BBox = {
  topLeft: { re: -2, im: 1.2 },
  botRight: { re: 0.5, im: -1.2 },
};

export { DEFAULT_PARAMS, MANDELBROT_BBOX };
