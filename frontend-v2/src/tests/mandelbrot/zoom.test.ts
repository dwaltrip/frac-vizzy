import { describe, it, expect } from 'vitest';

import { ComplexNum } from '@/mandelbrot/types';
import { getMousePosAsComplexNumber } from '@/mandelbrot/interactions/mouse-coords-for-params';
import { TILE_SIZE_IN_PX } from '@/mandelbrot/zoom';
import { ParamsManager } from '@/mandelbrot/params-manager';
import { performZoom } from '@/mandelbrot/interactions/perform-zoom';

// -----------------------------------------
// TODO: this should be failing.............
// -----------------------------------------
describe('zoom', () => {
  it('should preserve the mouse position when zooming in', () => {
    const test_case = {
      mousePos: { x: 387, y: 480 },
      view: { width: 800, height: 700 },
      params: {
        zoom: 4.7682,
        center: { re: -0.5551, im: -0.5507 },
        defaultTileSizePx: TILE_SIZE_IN_PX,
      },
      zoomChanges: [-0.02, -0.02, 0.02, 0.02],
    };
    // const mousePosInComplexCoords = { re: -0.5646, im: -0.6462 };

    const paramsManager = new ParamsManager(test_case.params);
    paramsManager.commitTarget();

    const initialMouseCoords: ComplexNum = getMousePosAsComplexNumber(
      test_case.mousePos,
      paramsManager.current,
      test_case.view,
    );
    console.log('initialMouseCoords', initialMouseCoords);
    let currMouseCoords: ComplexNum = initialMouseCoords;

    for (const zoomChange of test_case.zoomChanges) {
      console.log('params:', JSON.stringify(paramsManager.target, null, 2));
      performZoom(
        paramsManager,
        zoomChange,
        test_case.mousePos,
        test_case.view,
      );
      currMouseCoords = getMousePosAsComplexNumber(
        test_case.mousePos,
        paramsManager.target,
        test_case.view,
      );
      console.log('currMouseCoords', currMouseCoords);
      expect(currMouseCoords).toEqual(initialMouseCoords);
    }
  });
});
