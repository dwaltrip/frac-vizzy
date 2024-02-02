import {
  ComplexNum,
  FrozenRenderParams,
  MousePos,
  Viewport,
} from '@/mandelbrot/types';
import { calcPixelToComplexUnitScale } from '@/mandelbrot/zoom';

function getMousePosAsComplexNumber(
  mousePos: MousePos,
  params: FrozenRenderParams,
  view: Viewport,
): ComplexNum {
  const unitsPerPixel = calcPixelToComplexUnitScale(params.zoom);
  const centerToMouseVec = {
    x: mousePos.x - view.width / 2,
    y: mousePos.y - view.height / 2,
  };
  return {
    re: params.center.re + centerToMouseVec.x * unitsPerPixel,
    im: params.center.im - centerToMouseVec.y * unitsPerPixel,
  };
}

export { getMousePosAsComplexNumber };
