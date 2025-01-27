// TODO: dead code, remove this soon.

import {
  ComplexNum,
  FrozenRenderParams,
  MousePos,
  Rect,
} from '@/mandelbrot/types';
import { calcUnitsPerPixel } from '@/mandelbrot/zoom';

function getMousePosAsComplexNumber(
  mousePos: MousePos,
  params: FrozenRenderParams,
  view: Rect,
): ComplexNum {
  const unitsPerPixel = calcUnitsPerPixel(params.zoom);
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
