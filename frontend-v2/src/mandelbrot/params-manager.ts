import { deepClone } from '@/utils/deep-clone';
import { clamp } from '@/utils/clamp';

import { DEFAULT_PARAMS } from '@/mandelbrot/constants';
import { ComplexNum, FrozenRenderParams } from '@/mandelbrot/types';
import { calcPixelToComplexUnitScale } from '@/mandelbrot/zoom';

class ParamsManager {
  private _current: FrozenRenderParams;
  private _target: RenderParams;

  constructor(initial?: RenderParams) {
    if (!initial) {
      // TODO: default param values should be managed elsewhere
      initial = ParamsManager.getDefaultParams();
    }
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

  get hasNewParams(): boolean {
    return !areParamsEqual(this._current, this._target);
  }

  static getDefaultParams(): RenderParams {
    // NOTE: Typescript doesn't catch passing readonly into mutable...
    // So we gotta use deepClone.
    const { center, zoom }: { center: ComplexNum; zoom: number } =
      deepClone(DEFAULT_PARAMS);
    return new RenderParams(center, zoom);
  }
}

// TODO: rename to ViewState or something like that?
class RenderParams {
  private _center: Readonly<ComplexNum>;
  private _zoom: number;

  constructor(center: ComplexNum, zoom: number) {
    this._center = center;
    this._zoom = zoom;
  }

  get center(): Readonly<ComplexNum> {
    return this._center;
  }
  get zoom(): number {
    return this._zoom;
  }

  setCenter(center: ComplexNum) {
    this._center = center;
  }
  setZoom(zoom: number) {
    this._zoom = zoom;
  }

  moveCenter(dx: number, dy: number): void {
    const pxToMath = calcPixelToComplexUnitScale(this.zoom);
    const movement = { re: dx * pxToMath, im: dy * pxToMath };
    this.setCenter({
      re: this.center.re + movement.re,
      im: this.center.im - movement.im,
    });
  }

  updateZoom(amountToAdd: number): void {
    this._zoom = clamp(this.zoom + amountToAdd, 0, 40);
  }

  asFrozen(): FrozenRenderParams {
    const params: FrozenRenderParams = { center: this.center, zoom: this.zoom };
    return params;
  }

  static fromFrozen(params: FrozenRenderParams): RenderParams {
    return new RenderParams(params.center, params.zoom);
  }
}

type ParamsLike = RenderParams | FrozenRenderParams;

function areParamsEqual(a: ParamsLike, b: ParamsLike) {
  return (
    a.center.re === b.center.re &&
    a.center.im === b.center.im &&
    a.zoom === b.zoom
  );
}

export { ParamsManager, RenderParams };
