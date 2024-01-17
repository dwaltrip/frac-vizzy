import { MousePos } from '@/mandelbrot/types';

// TODO: move inside interactions dir? also maybe move MousePos type here
function getMousePos(rect: DOMRect, event: MouseEvent): MousePos {
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export { type MousePos, getMousePos };
