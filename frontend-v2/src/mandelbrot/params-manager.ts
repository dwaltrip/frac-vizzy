import { deepClone } from '@/utils/deep-clone';
import { clamp } from '@/utils/clamp';

import { DEFAULT_PARAMS } from '@/mandelbrot/constants';
import { ComplexNum, FrozenRenderParams } from '@/mandelbrot/types';
import { calcPixelToComplexUnitScale } from '@/mandelbrot/zoom';

class ParamsManager {
  private _current: FrozenRenderParams;
  private _target: RenderParams;

  constructor(initial: RenderParams) {
    this._current = initial.asFrozen();
    this._target = initial;
  }

  commitTarget() {
    this._current = this._target.asFrozen();
  }

  get current(): FrozenRenderParams {
    return this._current;
  }

  get target(): RenderParams {
    return this._target;
  }
}

// TODO: rename to ViewState or something like that?
class RenderParams {
  center: ComplexNum;
  zoom: number;

  constructor(center: ComplexNum, zoom: number) {
    this.center = center;
    this.zoom = zoom;
  }

  static getDefaultParams(): RenderParams {
    // NOTE: Typescript doesn't catch passing readonly into mutable...
    // So we gotta use deepClone.
    const { center, zoom }: { center: ComplexNum; zoom: number } =
      deepClone(DEFAULT_PARAMS);
    return new RenderParams(center, zoom);
  }

  moveCenter(dx: number, dy: number): void {
    const pxToMath = calcPixelToComplexUnitScale(this.zoom);
    const movement = { re: dx * pxToMath, im: dy * pxToMath };
    this.center.re += movement.re;
    this.center.im -= movement.im;
  }

  setCenter(center: ComplexNum): void {
    this.center = center;
  }

  updateZoom(amountToAdd: number): void {
    this.zoom = clamp(this.zoom + amountToAdd, 0, 40);
  }

  setZoom(zoom: number): void {
    this.zoom = zoom;
  }

  // TODO: instead of a frozen type, just hide the state behind getters?
  asFrozen(): FrozenRenderParams {
    const params: FrozenRenderParams = { center: this.center, zoom: this.zoom };
    return params;
  }

  static fromFrozen(params: FrozenRenderParams): RenderParams {
    return new RenderParams(params.center, params.zoom);
  }
}

export { ParamsManager, RenderParams };
