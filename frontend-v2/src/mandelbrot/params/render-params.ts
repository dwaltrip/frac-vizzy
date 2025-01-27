import qs from 'qs';

import { DeepReadonly } from '@/types';
import { invariant } from '@/utils/invariant';

import { Color, ComplexNum, Rect } from '@/mandelbrot/types';
import { createZoomInfo, TILE_SIZE_IN_PX } from '@/mandelbrot/zoom';

type pixels = number;

type ColoringAlgorithm = 'linear' | 'histogram';

interface ColorParams {
  algorithm: ColoringAlgorithm;
  color1: Color.RGB;
  color2: Color.RGB;
}

// TODO: split out different param types??
type RenderParamsData = {
  // --- viewport params ---
  center: ComplexNum;
  zoom: number;

  // Height and width of the canvas in pixels. The app doesn't control this
  // it's dynamically determined by the window size.
  // As such, we don't serialize it into the URL.
  view: Rect;

  // --- calculation params ---
  iters: number;

  // --- visualization params ---
  colors: ColorParams;

  // --- other ---
  // The size of the tile in pixels when zoom is an integer.
  // With smooth zoom, the rendered tiles are never this exact size.
  // There is always some fractional part of the zoom that we need to account for,
  //   which is done by scaling the tiles appropriately.
  // See the rendering code in `render-tile-data.ts` for more details.
  // This hard-coded in the source code, so we don't serialize it into the URL.
  baseTileSizePx: pixels;
};

// These are the params that are managed by the app,
// and which the app can change directly.
// `view` is determined by the window size and we can't change that.
// `baseTileSizePx` is a hard-coded value in the source code.
type ManagedRenderParams = Omit<RenderParamsData, 'view' | 'baseTileSizePx'>;

const BOUNDING_BOX = {
  topLeft: { re: -2, im: 1.2 },
  botRight: { re: 0.5, im: -1.2 },
};

const { topLeft, botRight } = BOUNDING_BOX;
const DEFAULT_CENTER = {
  re: Number((topLeft.re + (botRight.re - topLeft.re) / 2).toFixed(3)),
  im: Number((topLeft.im - (topLeft.im - botRight.im) / 2).toFixed(3)),
};

const DEFAULT_PARAMS: ManagedRenderParams = {
  center: DEFAULT_CENTER,
  // TODO: default zoom should be determined by user's screen size.
  zoom: 1,
  iters: 100,

  colors: {
    algorithm: 'histogram',
    color1: { r: 30, g: 0, b: 0 },
    color2: { r: 255, g: 255, b: 255 },
  },
};

// TODO: add default fallbacks for missing values.
// -------------------------------------------
// TODO: MORE VALIDATION / HANDLING BAD VALUES
// -------------------------------------------
function getInitialParams(view: Rect): [ManagedRenderParams, boolean] {
  const url = new URL(window.location.href);
  // TODO: how does typing working with 'qs'?
  const data = qs.parse(url.searchParams.toString()) as any;
  console.log('getInitialParams -- data', JSON.stringify(data, null, 2));

  // TOOD: make this more robust / better
  if (!data.pos) {
    return [DEFAULT_PARAMS, true];
  }

  let color1: Color.RGB, color2: Color.RGB;
  if (data.cg) {
    const colorParts = data.cg.replaceAll(/[\(\)]/g, '').split(',');
    color1 = parseColor(colorParts.slice(0, 3));
    color2 = parseColor(colorParts.slice(3, 6));
  } else {
    color1 = DEFAULT_PARAMS.colors.color1;
    color2 = DEFAULT_PARAMS.colors.color2;
  }

  const zoom = Number(data.z);
  const center = trimCenterCoords(
    {
      re: Number(data.pos?.r ?? DEFAULT_CENTER.re),
      im: Number(data.pos?.i ?? DEFAULT_CENTER.im),
    },
    zoom,
    view,
  );

  const params = {
    center,
    zoom,
    iters: parseInt(data.il),
    colors: {
      algorithm: data.cm,
      color1,
      color2,
    },
  };
  return [params, false];
}

/* Remove non-significant digits from the center coordinates */
function trimCenterCoords(
  center: ComplexNum,
  zoom: number,
  viewport: Rect,
): ComplexNum {
  const zoomInfo = createZoomInfo(zoom);
  const shortSide = Math.min(viewport.width, viewport.height);
  // length of the short side in complex plane units
  const d = (shortSide / TILE_SIZE_IN_PX) * zoomInfo.tileSize;

  const numSignificantDecimals = Math.floor(-1 * Math.log10(d / 10000));
  invariant(numSignificantDecimals > 0, 'Should be positive');

  const trim = (num: number) => Number(num.toFixed(numSignificantDecimals));
  return {
    re: trim(center.re),
    im: trim(center.im),
  };
}

function parseColor([r, g, b]: [string, string, string]): Color.RGB {
  return {
    r: parseInt(r),
    g: parseInt(g),
    b: parseInt(b),
  };
}

// --------------- NOT USING, probably delete ---------------
// @ts-ignore
function isSerializedRenderParamsLegacy(
  data: any,
): data is SerializedRenderParams_Legacy {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.pos === 'object' &&
    typeof data.pos.r === 'number' &&
    typeof data.pos.i === 'number' &&
    typeof data.z === 'number' &&
    typeof data.il === 'number' &&
    typeof data.cm === 'string' &&
    typeof data.cg === 'string'
  );
}
// --------------- NOT USING, probably delete ---------------

function serializeColor(color: Color.RGB): string {
  return `${color.r},${color.g},${color.b}`;
}

// This is the old format.
interface SerializedRenderParams_Legacy {
  pos: { r: number; i: number };
  z: number;
  il: number;
  cm: ColoringAlgorithm;
  cg: string;
}

interface SerializedRenderParams {
  re: number;
  im: number;
  z: number;
  iters: number;
  alg: ColoringAlgorithm;
  c1: string;
  c2: string;
}

function serializeParamsForUrl(
  params: RenderParamsData,
): SerializedRenderParams_Legacy {
  const {
    center: c,
    colors: { color1, color2 },
  } = params;
  return {
    pos: { r: c.re, i: c.im },
    z: params.zoom,
    il: params.iters,
    cm: params.colors.algorithm,
    cg: `(${serializeColor(color1)},${serializeColor(color2)})`,
  };
}

type RenderParamsUpdate =
  | { type: 'zoom'; value: number }
  | { type: 'center'; value: ComplexNum }
  | { type: 'iters'; value: number }
  | { type: 'colors'; value: Partial<ColorParams> }
  | { type: 'view'; value: Rect };

type FrozenRenderParams = DeepReadonly<RenderParamsData>;

class RenderParams {
  center: ComplexNum;
  zoom: number;
  iters: number;

  colors: ColorParams;
  view: Rect;

  baseTileSizePx: pixels;

  constructor(initial: RenderParamsData) {
    this.center = initial.center;
    this.zoom = initial.zoom;
    this.iters = initial.iters;

    this.colors = initial.colors;
    this.view = initial.view;

    this.baseTileSizePx = initial.baseTileSizePx;
  }

  asFrozen(): FrozenRenderParams {
    // TODO: use a deep copy to make this nicer
    return {
      center: { ...this.center },
      zoom: this.zoom,
      iters: this.iters,

      colors: { ...this.colors },
      view: { ...this.view },

      baseTileSizePx: this.baseTileSizePx,
    };
  }

  clone(): RenderParams {
    return new RenderParams(this.asFrozen());
  }
}

export {
  RenderParams,
  type RenderParamsData,
  type ColoringAlgorithm,
  type ColorParams,
  type RenderParamsUpdate,
  type FrozenRenderParams,
  type SerializedRenderParams,
  type SerializedRenderParams_Legacy,
  type ManagedRenderParams,
  serializeParamsForUrl,
  getInitialParams,
  // TODO: should trimCenterCoords and trimZoom go in a different file?
  trimCenterCoords,
};
