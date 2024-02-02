import { deepClone } from '@/utils/deep-clone';
import { clamp } from '@/utils/clamp';

import { DEFAULT_PARAMS } from '@/mandelbrot/constants';
import { ComplexNum, FrozenRenderParams } from '@/mandelbrot/types';
import {
  calcPixelToComplexUnitScale,
  TILE_SIZE_IN_PX,
} from '@/mandelbrot/zoom';
import { i } from 'vitest/dist/reporters-1evA5lom.js';

class ParamsManager {
  private _current: FrozenRenderParams | null;
  private _target: RenderParams;

  constructor(initial?: FrozenRenderParams) {
    // TODO: default param values should be managed elsewhere
    initial = initial ? initial : ParamsManager.getDefaultParams();

    this._current = null;
    this._target = new RenderParams(initial.center, initial.zoom);
  }

  commitTarget() {
    this._current = this._target.asFrozen();
    console.log('-- commitTarget -- current params zoom:', this._current.zoom);
    // console.log('cmtTrgt -- z:', this._current.zoom.toFixed(5));
  }

  get current(): FrozenRenderParams {
    if (!this._current) throw new Error('current params not set');
    return this._current;
  }

  get target(): RenderParams {
    return this._target;
  }

  get hasNewParams(): boolean {
    if (!this._current) {
      // console.log('hasNewParams - !this._current');
      return true;
    }
    // console.log('hasNewParams - areParamsEqual', areParamsEqual(this._current, this._target));
    return !areParamsEqual(this._current, this._target);
  }

  static getDefaultParams(): FrozenRenderParams {
    // NOTE: Typescript doesn't catch passing readonly into mutable...
    // So we gotta use deepClone.
    const { center, zoom }: { center: ComplexNum; zoom: number } =
      deepClone(DEFAULT_PARAMS);
    return new RenderParams(center, zoom).asFrozen();
  }
}

// TODO: rename to ViewState or something like that?
class RenderParams {
  private _center: Readonly<ComplexNum>;
  private _zoom: number;
  defaultTileSizePx: number = TILE_SIZE_IN_PX;

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
    // console.log('setZoom', zoom);
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
    // console.log('updateZoom', amountToAdd);
    this._zoom = clamp(this.zoom + amountToAdd, 0, 40);
  }

  asFrozen(): FrozenRenderParams {
    return {
      center: this.center,
      zoom: this.zoom,
      defaultTileSizePx: this.defaultTileSizePx,
    };
  }

  static fromFrozen(params: FrozenRenderParams): RenderParams {
    return new RenderParams(params.center, params.zoom);
  }
}

// TODO: This name feels wierd... there's probably a better way of doin this.
type RenderParamsLike = RenderParams | FrozenRenderParams;

function areParamsEqual(a: RenderParamsLike, b: RenderParamsLike) {
  return (
    a.center.re === b.center.re &&
    a.center.im === b.center.im &&
    a.zoom === b.zoom
  );
}

export { ParamsManager, RenderParams, type RenderParamsLike };
