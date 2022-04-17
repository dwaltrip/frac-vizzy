import { assert } from '../lib/assert';
import { randInt } from '../lib/randInt';
import { TILE_SIDE_LENGTH_IN_PIXELS, COLOR_METHODS } from '../settings';

import { calcMandlebrotSetStatus } from './computeMandelbrot';

function buildGetColorForPointUsingHistogram(histogram, params) {
  const { colorGradient, colorMethod } = params;
  const [color1, color2] = colorGradient;

  const { numPoints: totalPoints, data } = histogram;
  const sortedKeys = Object.keys(data).map(num => parseInt(num)).sort();

  // TODO: I'm not 100% sure this multi-gradient stuff is working correclty.

  const colorMap = new Map();
  const numColors = colorGradient.length;
  const numGradients = numColors - 1;
  const gradientLength = totalPoints / numGradients;

  let gradientIndex = 0;
  let gradientSwitchPoint = gradientLength;

  let cumulativePointsSeen = 0;
  sortedKeys.forEach(iteration => {
    cumulativePointsSeen += data[iteration];

    if (cumulativePointsSeen > gradientSwitchPoint) {
      gradientIndex += 1;
      gradientSwitchPoint += gradientLength;
    }
    assert(
      gradientIndex + 2 <= colorGradient.length,
      `gradientIndex ${gradientIndex} is too big`,
    );

    const [color1, color2] = colorGradient.slice(gradientIndex, gradientIndex+2);
    const percent = cumulativePointsSeen / totalPoints;

    colorMap.set(iteration, {
      r: percentToRangeVal(percent, color1.r, color2.r),
      g: percentToRangeVal(percent, color1.g, color2.g),
      b: percentToRangeVal(percent, color1.b, color2.b),
    });
  });

  return function getColor(status) {
    const [isInSet, iterationCount] = status;
    if (isInSet) {
      return { r: 0, g: 0, b: 0 };
    }
    if (colorMethod === COLOR_METHODS.histogram2) {
      return colorMap.get(Math.ceil(Math.pow(iterationCount, .75)));
    }
    return colorMap.get(iterationCount);
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
  assert(colorGradient.length >= 2, colorGradient)

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

    const [isInSet, iterationCount] = calcMandlebrotSetStatus(
      real, complex, iterationLimit,
    );
    if (!isInSet) {
      maxDivergenceFactor = Math.max(
        transformForColor(iterationCount, colorMethod),
        maxDivergenceFactor,
      );
    }
  }

  const colorMap = new Map();
  const numColors = colorGradient.length;
  const numGradients = numColors - 1;
  const gradientLength = maxDivergenceFactor / numGradients;

  // TODO: Some perf improvments possible around here, especially for large
  // values of `maxIter`. I think it is probably not the bottleneck, so might
  // not be worth much effort (it'd be good to check though).
  // TODO: extract this logic and unit test it.
  for (let g=0; g<numGradients; g++) {
    const dfStart = Math.floor(g * gradientLength);
    const dfEnd = dfStart + gradientLength;
    const [color1, color2] = colorGradient.slice(g, g+2);
    assert(notUndef(color1) && notUndef(color2));

    for (let i=dfStart; i<=dfEnd; i++) {
      const percent = (i - dfStart) / gradientLength;
      const r = percentToRangeVal(percent, color1.r, color2.r);
      const g = percentToRangeVal(percent, color1.g, color2.g);
      const b = percentToRangeVal(percent, color1.b, color2.b);
      colorMap.set(i, { r, g, b });
    }
  }

  // ----------------------------------------------------------------------
  // TODO: `maxColorKey` is a hack due to our shitty random sample thing.
  // Sometimes the maxDivergenceFactor it produces is not actually the max
  // among all of the points.
  // Fix this!!
  // ----------------------------------------------------------------------
  const maxColorKey = Math.max(...colorMap.keys());

  return function getColor(status) {
    const [isInSet, iterationCount] = status;
    if (isInSet) {
      return { r: 0, g: 0, b: 0 };
    }

    const val = transformForColor(iterationCount, colorMethod);
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
  let val;
  if (colorMethod === COLOR_METHODS.linear_iters) {
    val = iterationCount;
  }
  else if (colorMethod === COLOR_METHODS.sqrt_iters) {
    val = Math.sqrt(iterationCount);
  }
  return Math.ceil(val);
}

function notUndef(val) {
  return typeof val !== 'undefined';
}

export { buildGetColorForPoint, buildGetColorForPointUsingHistogram };
