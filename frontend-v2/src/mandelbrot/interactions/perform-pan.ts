import {
  FrozenRenderParams,
  RenderParams,
} from '@/mandelbrot/params/render-params';
import { calcUnitsPerPixel } from '@/mandelbrot/zoom';

function performPan(
  renderedParams: FrozenRenderParams,
  vec: { x: number; y: number },
): RenderParams {
  const target = new RenderParams(renderedParams);
  const unitsPerPixel = calcUnitsPerPixel(target.zoom);
  const movement = {
    re: vec.x * unitsPerPixel,
    im: vec.y * unitsPerPixel * -1,
  };
  target.center = {
    re: renderedParams.center.re + movement.re,
    im: renderedParams.center.im + movement.im,
  };
  return target;
}

export { performPan };
