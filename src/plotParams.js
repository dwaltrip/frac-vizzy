import qs from 'qs';

/* ----------------------------------------------------------------------------
TODO: 
  * Where do I set the number of pixels per tile?
  * Best way to adjust the realRange and complexRange if they drastically
      conflict with the specified zoom level? In reality, knowing if they
      conflict depends on the viewport size. What assumptions should I make
      about the viewport?

---------------------------------------------------------------------------- */ 

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
  realRange: { start: "-1.5", end: "0.5" },
  complexRange: { start: "-1.2", end: "1.2" },
  zoomLevel: "0",
  iterationLimit: "250",
};

function getInitialParams() {
  const url = new URL(window.location.href);
  const urlData = deserializeParams(qs.parse(url.searchParams.toString()));
  const defaults = DEFAULT_PARAMS;
  // TODO: Better error handling here.
  // We need to handle any possible user input for the URL param values.
  return {
    realRange: parseRange({
      ...defaults.realRange,
      ...urlData.realRange,
    }),
    complexRange: parseRange({
      ...defaults.complexRange,
      ...urlData.complexRange,
    }),
    zoomLevel: parseInt(urlData.zoomLevel || defaults.zoomLevel),
    iterationLimit: parseInt(urlData.iterationLimit || defaults.iterationLimit),
  };
}

// TODO: when there is a conflict between the `zoomLevel` and `realRange / complexRange`,
//   I need to prefer one over the other. Which should have precedence?
// ----------------------------------------------------------------------------
// New idea.... instead of defining the "rectangular region of the math plane",
//   I could just define the center point...
// Would I still be able to guarantee that the entire Mandelbrot fractal is
//   visible with the default params?
//   Maybe I could set the initial zoom (when the page first loads) such
//   that the whole things fits in the viewport
//   (assuming a viewport that meets certain constraints, e.g. some min size)
// ----------------------------------------------------------------------------
function normalizeParams(params, canvas) {
  const { realRange, complexRange, zoomLevel, ...others } = params;

  const tileSideLength = 1 / Math.pow(2, zoomLevel);
  const rLength = realRange.end - realRange.start;
  const cLength = complexRange.end - complexRange.start;

  const 

  if ((rLength / tileSideLength) > MAX_TILES_PER_DIM) {
    const rLengthAdj = tileSideLength * MAX_TILES_PER_DIM;
  }


  return {
    realRange: adjustedRealRange,
    complexRange: adjustedComplexRange,
    zoomLevel,
    ...others
  };
}

// TODO: Clean up / DRY up the serialize / deserialize logic?
// Might be hard to do so while keeping the code reasonable.

function serializeParams(params) {
  const serializeRange = range => ({ s: range.start, e: range.end });
  return {
    rr: serializeRange(params.realRange),
    cr: serializeRange(params.complexRange),
    z: params.zoomLevel,
    il: params.iterationLimit,
  };
}

function deserializeParams(params) {
  const deserializeRange = range => (range ?
    { start: range.s, end: range.e } :
    {}
  );
  return {
    realRange: deserializeRange(params.rr),
    complexRange: deserializeRange(params.cr),
    zoomLevel: params.z,
    iterationLimit: params.il,
  };
}

function parseRange(range) {
  return { start: parseFloat(range.start), end: parseFloat(range.end) };
}

export { getInitialParams, serializeParams };
