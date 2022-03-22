import qs from 'qs';

import { assert } from './lib/assert';
import { TILE_SIDE_LENGTH_IN_PIXELS, COLOR_METHODS } from './settings';
import { getSideLength } from './mandelbrot/calcs';

const DEFAULT_PARAMS = {
  centerPos: { r: "0", c: "0" },
  iterationLimit: "250",
  colorMethod: COLOR_METHODS.sqrt_iters,
};

// These points draw a box around the fully zoomed out Mandelbrot
const DEFAULT_TOP_LEFT = { r: -1.5, c: 1.2 };
const DEFAULT_BOT_RIGHT = { r: 0.5, c: -1.2 };

function getInitialParams(viewport) {
  const url = new URL(window.location.href);
  const urlData = deserializeParams(qs.parse(url.searchParams.toString()));

  const defaults = { ...DEFAULT_PARAMS };

  if (!urlData.zoomLevel) {
    // ------------------------------------------------------------------------
    // Compute default zoom level so the entire Mandelbrot fits in image
    // TODO: Should I move this outside of `getInitialParams`?

    const rLen = DEFAULT_BOT_RIGHT.r - DEFAULT_TOP_LEFT.r;
    const cLen = DEFAULT_TOP_LEFT.c - DEFAULT_BOT_RIGHT.c;

    const tileGrid = {
      height: Math.ceil(viewport.height / TILE_SIDE_LENGTH_IN_PIXELS),
      width: Math.ceil(viewport.width / TILE_SIDE_LENGTH_IN_PIXELS),
    };

    // TODO: would be nice to have a test for this logic
    const zoomLevelFromR = Math.floor(-1 * Math.log2(rLen / tileGrid.width));
    const zoomLevelFromC = Math.floor(-1 * Math.log2(cLen / tileGrid.height));
    defaults.zoomLevel = Math.min(zoomLevelFromR, zoomLevelFromC);
    // ------------------------------------------------------------------------
  }

  // TODO: Better error handling here.
  // We need to handle any possible user input for the URL param values.
  return {
    centerPos: parsePos({
      ...defaults.centerPos,
      ...urlData.centerPos,
    }),
    zoomLevel: parseInt(urlData.zoomLevel || defaults.zoomLevel),
    iterationLimit: parseInt(urlData.iterationLimit || defaults.iterationLimit),
    colorMethod: urlData.colorMethod || defaults.colorMethod,
  };
}

function serializeParams(params) {
  return {
    pos: params.centerPos,
    z: params.zoomLevel,
    il: params.iterationLimit,
    cm: params.colorMethod,
  };
}

function deserializeParams(params) {
  return {
    centerPos: params.pos,
    zoomLevel: params.z,
    iterationLimit: params.il,
    colorMethod: params.cm,
  };
}

function parsePos(pos) {
  return { r: parseFloat(pos.r), c: parseFloat(pos.c) };
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

export { getInitialParams, serializeParams, normalizeParams };
