import { randInt } from '../lib/randInt';
import { TILE_SIDE_LENGTH_IN_PIXELS, COLOR_METHODS } from '../settings';

import { calcMandlebrotSetStatus } from './computeMandelbrot';

function buildGetColorForPointUsingHistogram(histogram, colorGradient) {
  const { numPoints: totalPoints, data } = histogram;
  const sortedKeys = Object.keys(data).map(num => parseInt(num)).sort();

  const colorMap = new Map();

  let cumulativePointsSeen = 0;
  sortedKeys.forEach(iteration => {
    cumulativePointsSeen += data[iteration];
    const percent = cumulativePointsSeen / totalPoints;

    const r = percentToRangeVal(percent, colorGradient.start.r, colorGradient.end.r);
    const g = percentToRangeVal(percent, colorGradient.start.g, colorGradient.end.g);
    const b = percentToRangeVal(percent, colorGradient.start.b, colorGradient.end.b);
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
  colorGradient,
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

  const colorMap = new Map();

  for (let i=0; i<=maxDivergenceFactor; i++) {
    const percent = i / maxDivergenceFactor;
    const r = percentToRangeVal(percent, colorGradient.start.r, colorGradient.end.r);
    const g = percentToRangeVal(percent, colorGradient.start.g, colorGradient.end.g);
    const b = percentToRangeVal(percent, colorGradient.start.b, colorGradient.end.b);
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
