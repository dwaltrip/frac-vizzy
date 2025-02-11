import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import { ComplexRegion } from '@/mandelbrot/types';
import { calcUnitsPerPixel } from '@/mandelbrot/zoom';

function regionForParams(params: FrozenRenderParams): ComplexRegion {
  const { center, zoom, view } = params;
  const unitsPerPixel = calcUnitsPerPixel(zoom);
  const width = view.width * unitsPerPixel;
  const height = view.height * unitsPerPixel;
  const topLeft = {
    re: center.re - width / 2,
    im: center.im + height / 2,
  };
  return { width, height, topLeft };
}

export { regionForParams };
