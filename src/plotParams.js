import qs from 'qs';

import { assert } from './lib/assert';
import { segmentArray } from './lib/segmentArray';
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
  colorGradient: "(60,60,60,240,180,60)",
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
    colorGradient: parseGradient(urlData.colorGradient || defaults.colorGradient),
  };
}

function serializeParams(params) {
  const serializeGradient = gradient => (
    '(' +
    gradient.map(c => `${c.r},${c.g},${c.b}`).join(',') +
    ')'
  );

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

// TODO: more validation / error handling here.
function parseGradient(gradient) {
  const parts = gradient.replace(/[()]+/g, '').split(',');

  let colors = segmentArray(parts, 3);
  // discard last color if it doesn't have all 3 rgb values.
  if ((colors[colors.length -1 ] || {}).length !== 3) {
    colors = colors.slice(0, -1);
  }

  // Ugh.... TODO: review what we actually want to do here.
  // Or if this actually happens.
  if (colors.length === 1) {
    const c1 = colors[0];
    const cleanAndClamp = num => Math.min(Math.round(num), 235);
    const c2 = c1.map(part => cleanAndClamp(part * 1.5));
    colors.push(c2);
  }

  const parseColor = ([r, g, b]) => (
    { r: parseInt(r), g: parseInt(g), b: parseInt(b) }
  );
  return colors.map(parseColor);
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
