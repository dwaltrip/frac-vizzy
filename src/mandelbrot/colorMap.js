import { randInt } from '../lib/randInt';
import { TILE_SIDE_LENGTH_IN_PIXELS, COLOR_METHODS } from '../settings';

import { calcMandlebrotSetStatus } from './computeMandelbrot';

const BG_COLOR = { r: 247, g: 243, b: 238 };
// const BG_COLOR = { r: 227, g: 223, b: 228 };
// const BG_COLOR = { r: 220, g: 230, b: 255 };
// const BG_COLOR = { r: 250, g: 225, b: 220 };
// const BG_COLOR = { r: 220, g: 245, b: 220 };
// const BG_COLOR = { r: 250, g: 190, b: 180 };

const DARKEN_PERCENT = 0.35;
// const DARKEN_PERCENT = 0.60;

function buildGetColorForPointUsingHistogram(histogram) {
  const { numPoints: totalPoints, data } = histogram;
  const sortedKeys = Object.keys(data).map(num => parseInt(num)).sort();

  let colorRange = {
    start: {
      r: BG_COLOR.r * DARKEN_PERCENT,
      g: BG_COLOR.g * DARKEN_PERCENT,
      b: BG_COLOR.b * DARKEN_PERCENT,
    },
    end: BG_COLOR,
  };

  const colorMap = new Map();

  let cumulativePointsSeen = 0;
  sortedKeys.forEach(iteration => {
    cumulativePointsSeen += data[iteration];
    const percent = cumulativePointsSeen / totalPoints;

    const r = percentToRangeVal(percent, colorRange.start.r, colorRange.end.r);
    const g = percentToRangeVal(percent, colorRange.start.g, colorRange.end.g);
    const b = percentToRangeVal(percent, colorRange.start.b, colorRange.end.b);
    colorMap.set(iteration, { r, g, b });
  });

  return function getColor(status) {
    if (status.isInSet) {
      return { r: 0, g: 0, b: 0 };
    }
    return colorMap.get(status.iteration);
  };
}

function buildGetColorForPoint({
  colorMethod,
  centerPos,
  zoomLevel,
  iterationLimit,
  viewport,
}) {
  const makeRange = (c, delta) => ({ start: c - delta, end: c + delta });
  const rRange = makeRange(centerPos.r, viewport.realLen / 2);
  const cRange = makeRange(centerPos.c, viewport.complexLen / 2);

  const numPixels = viewport.width * viewport.height;
  const numSamples = Math.floor(numPixels / 1000);

  const rStepSize = (rRange.end - rRange.start) / (viewport.width - 1);
  const cStepSize = (cRange.end - cRange.start) / (viewport.height - 1);

  let maxDivergenceFactor = 0;
  // TODO: Is this consistent enough?
  // I would MUCH MUCH prefer a deterministic approach.
  for(let i=0; i<numSamples; i++) {
    const rIndex = randInt(0, viewport.width - 1);
    const cIndex = randInt(0, viewport.height - 1);

    const real = rRange.start + (rIndex * rStepSize);
    const complex = cRange.start + (cIndex * cStepSize);

    const status = calcMandlebrotSetStatus(real, complex, iterationLimit);
    if (!status.isInSet) {
      maxDivergenceFactor = Math.max(
        transformForColor(status.iteration, colorMethod),
        maxDivergenceFactor,
      );
    }
  }

  let colorRange = {
    start: {
      r: BG_COLOR.r * DARKEN_PERCENT,
      g: BG_COLOR.g * DARKEN_PERCENT,
      b: BG_COLOR.b * DARKEN_PERCENT,
    },
    end: BG_COLOR,
  };

  const colorMap = new Map();

  for (let i=0; i<=maxDivergenceFactor; i++) {
    const percent = i / maxDivergenceFactor;
    const r = percentToRangeVal(percent, colorRange.start.r, colorRange.end.r);
    const g = percentToRangeVal(percent, colorRange.start.g, colorRange.end.g);
    const b = percentToRangeVal(percent, colorRange.start.b, colorRange.end.b);
    colorMap.set(i, { r, g, b });
  }

  // ----------------------------------------------------------------------
  // TODO: `maxColorKey` is a hack due to our shitty random sample thing.
  // Sometimes the maxDivergenceFactor it produces is not actually the max
  // among all of the points.
  // Fix this!!
  // ----------------------------------------------------------------------
  const maxColorKey = Math.max(...colorMap.keys());

  return function getColor(status) {
    if (status.isInSet) {
      return { r: 0, g: 0, b: 0 };
    }

    const val = transformForColor(status.iteration, colorMethod);
    return (val > maxColorKey ?
      colorMap.get(maxColorKey) :
      colorMap.get(val)
    );
  };
}

function percentToRangeVal(percent, start, end) {
  return Math.floor(start + (percent * (end - start)));
}

function transformForColor(iterationCount, colorMethod) {
  // NOTE: For log functions, we need to add 1 as sometimes it diverges
  // when iteration=0. `log(0)` gives -Infinity, which is bad.
  // There isn't a meaningful difference between iteration values in the
  // interval of [1, iterationLimit] versus [0, iterationLimit - 1].
  // --------------------------------------------------------------------
  let val;
  if (colorMethod === COLOR_METHODS.sqrt_iters) {
    val = Math.sqrt(iterationCount);
  }
  else if (colorMethod === COLOR_METHODS.log_iters) {
    val = Math.log(iterationCount+1);
    // val = Math.log2(iterationCount+1);
  }
  else if (colorMethod === COLOR_METHODS.div_by_20) {
    val = iterationCount / 20;
    // val = iterationCount / 30;
  }
  return Math.ceil(val);
}

export { buildGetColorForPoint, buildGetColorForPointUsingHistogram };
