import { Color } from '@/mandelbrot/types';

function rgb(r: number, g: number, b: number): Color.RGB {
  return { r, g, b };
}

export { rgb };
