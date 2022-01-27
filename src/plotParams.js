import qs from 'qs';

const DEFAULT_PARAMS = {
  realRange: { start: "-1.5", end: "0.5" },
  complexRange: { start: "-1.2", end: "1.2" },
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
    iterationLimit: parseInt(urlData.iterationLimit || defaults.iterationLimit),
  };
}

// TODO: Clean up / DRY up the serialize / deserialize logic?
// Might be hard to do so while keeping the code reasonable.

function serializeParams(params) {
  const serializeRange = range => ({ s: range.start, e: range.end });
  return {
    rr: serializeRange(params.realRange),
    cr: serializeRange(params.complexRange),
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
    iterationLimit: params.il,
  };
}

function parseRange(range) {
  return { start: parseFloat(range.start), end: parseFloat(range.end) };
}

export { getInitialParams, serializeParams };
