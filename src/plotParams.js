import qs from 'qs';

import { TILE_SIDE_LENGTH_IN_PIXELS } from './settings';

// TODO: what are reasonable numbers here?
const VIEWPORT_CONSTRAINTS = {
  MIN_LENGTH: 400,
  MAX_LENGTH: 2000,
};

const MAX_TILES_PER_DIM = 10;
const MIN_TILES_PER_DIM = 2;

// TODO: where should this go?
const PIXELS_PER_TILE_DIM = 200;

const DEFAULT_PARAMS = {
  centerPos: { r: "0", c: "0" },
  iterationLimit: "250",
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
  };
}

function serializeParams(params) {
  return {
    pos: params.centerPos,
    z: params.zoomLevel,
    il: params.iterationLimit,
  };
}

function deserializeParams(params) {
  return {
    centerPos: params.pos,
    zoomLevel: params.z,
    iterationLimit: params.il,
  };
}

function parsePos(pos) {
  return { r: parseFloat(pos.r), c: parseFloat(pos.c) };
}

export { getInitialParams, serializeParams };
