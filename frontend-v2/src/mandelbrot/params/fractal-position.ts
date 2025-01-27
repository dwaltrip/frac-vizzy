// ------------------------------------------------------------------
// TODO: Dead code!! Some of this could be useful in nearish future.
// But otherwise should delete it soon.
// ------------------------------------------------------------------
import { clamp } from '@/utils/clamp';

import { ComplexNum } from '@/mandelbrot/types';
import { calcUnitsPerPixel } from '@/mandelbrot/zoom';

class FractalPosition {
  center: GetterSetter<Readonly<ComplexNum>>;
  zoom: GetterSetter<number>;

  constructor(center: ComplexNum, zoom: number) {
    this.center = makeGetterSetter(center, {
      move: (dx: number, dy: number) => this._moveCenter(dx, dy),
    });

    this.zoom = makeGetterSetter(zoom, {
      add: (amount: number) => this._zoomAdd(amount),
    });
  }

  private _moveCenter(dx: number, dy: number): ComplexNum {
    const unitsPerPixel = calcUnitsPerPixel(this.zoom.get());
    const movement = { re: dx * unitsPerPixel, im: dy * unitsPerPixel };
    const center = this.center.get();
    return {
      re: center.re + movement.re,
      im: center.im - movement.im,
    };
  }

  private _zoomAdd(amountToAdd: number): number {
    return clamp(this.zoom.get() + amountToAdd, 0, 40);
  }

  get data() {
    return {
      center: this.center.get(),
      zoom: this.zoom.get(),
    };
  }
}

type GetterSetter<T> = {
  get: () => T;
  set: (newValue: T) => void;
};

function makeGetterSetter<T>(
  initialValue: T,
  extraFuncs: { [key: string]: Function } = {},
): GetterSetter<T> {
  let value: T = initialValue;
  return {
    get: () => value,
    set: (newValue: T) => {
      value = newValue;
    },
    ...extraFuncs,
  };
}

export { FractalPosition };
