import qs from 'qs';

import { assert } from './lib/assert';
import { TILE_SIDE_LENGTH_IN_PIXELS, BOUNDING_BOX, COLOR_METHODS } from './settings';
import { getSideLength } from './mandelbrot/calcs';

const { topLeft, botRight } = BOUNDING_BOX;
const DEFAULT_CENTER = {
  r: (topLeft.r + ((botRight.r - topLeft.r) / 2)).toFixed(3),
  c: (topLeft.c - ((topLeft.c - botRight.c) / 2)).toFixed(3),
};

const DEFAULT_PARAMS = {
  centerPos: DEFAULT_CENTER,
  iterationLimit: "250",
  colorMethod: COLOR_METHODS.linear_iters,
  // TODO: Improve this serialization. Do something like `gradient=((60,60,60),(240,180,60))`.
  colorGradient: {
    s: { r: "60", g: "60", b: "60" },
    e: { r: "240", g: "180", b: "60" },
  },
};

function areParamsReady(params) {
  return params.zoomLevel !== null;
}

function getInitialParams() {
  const url = new URL(window.location.href);
  const urlData = deserializeParams(qs.parse(url.searchParams.toString()));

  const defaults = { ...DEFAULT_PARAMS };

  // TODO: Better error handling here.
  // We need to handle any possible user input for the URL param values.
  return {
    centerPos: parsePos({
      ...defaults.centerPos,
      ...urlData.centerPos,
    }),
    // The default `zoomLevel` depends on the viewpoert size, which we don't
    // have at this point. We set it later if urlData.zoomLevel is not present.
    zoomLevel: urlData.zoomLevel ? parseInt(urlData.zoomLevel) : null,
    iterationLimit: parseInt(urlData.iterationLimit || defaults.iterationLimit),
    colorMethod: urlData.colorMethod || defaults.colorMethod,
    colorGradient: parseGradient({
      ...defaults.colorGradient,
      ...urlData.colorGradient,
    }),
  };
}

function serializeParams(params) {
  const serializeGradient = gradient => ({ s: gradient.start, e: gradient.end });
  return {
    pos: params.centerPos,
    z: params.zoomLevel,
    il: params.iterationLimit,
    cm: params.colorMethod,
    cg: serializeGradient(params.colorGradient),
  };
}

function deserializeParams(params) {
  return {
    centerPos: params.pos,
    zoomLevel: params.z,
    iterationLimit: params.il,
    colorMethod: params.cm,
    colorGradient: params.cg,
  };
}

// TODO: why is this called parse? probably should be deserialize?
// Something else is off here... sort this out.
function parsePos(pos) {
  return { r: parseFloat(pos.r), c: parseFloat(pos.c) };
}

function parseGradient(gradient) {
  const parseColor = (color) => (
    { r: parseInt(color.r), g: parseInt(color.g), b: parseInt(color.b) }
  );
  return {
    start: parseColor(gradient.s),
    end: parseColor(gradient.e),
  };
}

function normalizePos(pos, sideLength, viewport) {
  const rLen = (viewport.width / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;
  const cLen = (viewport.height / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;

  const numMeaningfulDecimalPlaces = Math.floor(-1 * Math.log10(Math.min(rLen, cLen) / 1000));
  assert(numMeaningfulDecimalPlaces > 0, 'Should be positive');

  const truncateFloat = num => parseFloat(num.toFixed(numMeaningfulDecimalPlaces));
  return {
    r: truncateFloat(pos.r),
    c: truncateFloat(pos.c),
  };
}

function normalizeParams(params, viewport) {
  const sideLength = getSideLength(params.zoomLevel);
  return {
    ...params,
    centerPos: normalizePos(params.centerPos, sideLength, viewport),
  };
}

export { getInitialParams, areParamsReady, serializeParams, normalizeParams };
