import { assert } from 'lib/assert';
import { randInt } from 'lib/randInt';
import { TILE_SIDE_LENGTH_IN_PIXELS, COLOR_METHODS } from 'settings';

import { calcMandlebrotSetStatus } from 'mandelbrot/computeMandelbrot';

const IN_SET_COLOR = { r: 0, g: 0, b: 0 };

// -----------------------------------------------------------------------------

function buildGetColorFirstPass({
  colorMethod,
  colorGradient,
  centerPos,
  iterationLimit,
  viewport,
}) {
  assert(colorGradient.length >= 2, colorGradient)

  const useHistogram = (
    colorMethod === COLOR_METHODS.histogram ||
    colorMethod === COLOR_METHODS.histogram2
  );

  let colorDataCollector = (useHistogram ?
    makeColorDataCollectorForHistogram(colorMethod) :
    makeColorDataCollectorForMaxIter(colorMethod)
  );

  forEachInRandomSample({ centerPos, iterationLimit }, viewport, iterCount => {
    colorDataCollector.onPoint(iterCount);
  });

  if (useHistogram) {
    return buildGetColorWithHistogram(
      colorGradient,
      colorMethod,
      colorDataCollector.state,
    );
  }
  else {
    return buildGetColorWithMaxIter(
      colorGradient,
      colorMethod,
      colorDataCollector.state,
    );
  }
}

function buildGetColorFinalPass({ tiles, colorMethod, colorGradient }) {
  assert(colorGradient.length >= 2, colorGradient)

  const useHistogram = (
    colorMethod === COLOR_METHODS.histogram ||
    colorMethod === COLOR_METHODS.histogram2
  );

  let colorDataCollector = (useHistogram ?
    makeColorDataCollectorForHistogram(colorMethod) :
    makeColorDataCollectorForMaxIter(colorMethod)
  );

  forEachInAllTiles(tiles, iterCount => {
    colorDataCollector.onPoint(iterCount);
  });

  if (useHistogram) {
    return buildGetColorWithHistogram(
      colorGradient,
      colorMethod,
      colorDataCollector.state,
    );
  }
  else {
    return buildGetColorWithMaxIter(
      colorGradient,
      colorMethod,
      colorDataCollector.state,
    );
  }
}

// -----------------------------------------------------------------------------

function buildGetColorWithHistogram(colorGradient, colorMethod, colorData) {
  const { histogram } = colorData;
  const [color1, color2] = colorGradient;

  const { numPoints: totalPoints, data } = histogram;
  const sortedKeys = Object.keys(data)
    .map(num => parseInt(num))
    .sort((a, b) => a - b);

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

  let maxIter = sortedKeys[sortedKeys.length - 1];
  let currColor = colorMap.get(sortedKeys[0]);

  for (let i=0; i<maxIter; i++) {
    if (colorMap.has(i)) {
      currColor = colorMap.get(i);
    }
    else {
      colorMap.set(i, currColor);
    }
  }

  let maxIterColor = colorMap.get(maxIter);

  return function getColor(status) {
    const [isInSet, iterCount] = status;
    if (isInSet) {
      return IN_SET_COLOR;
    }

    const val = (colorMethod === COLOR_METHODS.histogram2 ?
      Math.ceil(Math.pow(iterCount, .75)) :
      iterCount
    );

    // We fill in all missing integer values from `sortedKeys` above.
    // However, with the full set of points, we may have an iteration count
    // higher than the highest seen in the random sampling.
    // It should be a small number of points.
    // We can just use the color for the highest iter we've seen.
    // It's only temporary, as the second pass of coloring occurs right after.
    return colorMap.has(val) ? colorMap.get(val) : maxIterColor;
  };
}

function buildGetColorWithMaxIter(colorGradient, colorMethod, colorData) {
  const { maxDivergenceFactor } = colorData;

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

  const maxColorKey = Math.max(...colorMap.keys());

  return function getColor(status) {
    const [isInSet, iterationCount] = status;
    if (isInSet) {
      return IN_SET_COLOR;
    }

    // TODO: Rename `transformForColor`.........
    const val = transformForColor(iterationCount, colorMethod);

    // NOTE: This maxColorKey fallback is only relevant during the 1st pass
    // random sample coloring.
    // I don't love it. On some plots the max value found during the sampling
    // is much lower than the actual max value. This results in flashes of
    // bright lines as the first pass coloring is replaced with the final pass.
    return (val > maxColorKey ?
      colorMap.get(maxColorKey) :
      colorMap.get(val)
    );
  };
}

// -----------------------------------------------------------------------------

function makeColorDataCollectorForMaxIter(colorMethod) {
  const transformVal = iterCount => transformForColor(iterCount, colorMethod);

  return makeColorDataCollector({
    initialState: {
      maxDivergenceFactor: 0,
    },
    stateUpdater: (state, iterCount) => {
      state.maxDivergenceFactor = Math.max(
        transformVal(iterCount),
        state.maxDivergenceFactor,
      );
    },
  });
}

function makeColorDataCollectorForHistogram(colorMethod) {
  const histogram = new Histogram(
    (colorMethod === COLOR_METHODS.histogram2 ?
      val => Math.ceil(Math.pow(val, .75)) :
      null
    )
  );

  return makeColorDataCollector({
    initialState: { histogram },
    stateUpdater: (state, iterCount) => {
      state.histogram.increment(iterCount);
    },
  });
}

class Histogram {
  constructor(valTransform) {
    this.data = {}
    this.numPoints = 0;
    this.valTransform = valTransform;
  }

  increment(val) {
    val = this.valTransform ? this.valTransform(val) : val;
    if (!(val in this.data)) {
      this.data[val] = 0;
    }
    this.data[val] += 1;
    this.numPoints += 1;
  }
}

function makeColorDataCollector({ initialState, stateUpdater }) {
  return {
    state: { ...initialState },

    onPoint(iterCount) {
      stateUpdater(this.state, iterCount);
    },
  };
};

// ----------------------------------------------------------------------------

function forEachInAllTiles(tiles, func) {
  tiles.forEach(({ tileId, points }) => {
    points.forEach(row => {
      row.forEach(([isInSet, iterCount]) => func(iterCount));
    });
  });
}

function forEachInRandomSample(params, viewport, func) {
  const { centerPos, iterationLimit } = params;

  const makeRange = (c, delta) => ({ start: c - delta, end: c + delta });
  const rRange = makeRange(centerPos.r, viewport.realLen / 2);
  const cRange = makeRange(centerPos.c, viewport.complexLen / 2);

  const numPixels = viewport.width * viewport.height;
  const numSamples = Math.floor(numPixels / 100);

  const rStepSize = (rRange.end - rRange.start) / (viewport.width - 1);
  const cStepSize = (cRange.end - cRange.start) / (viewport.height - 1);

  for(let i=0; i<numSamples; i++) {
    const rIndex = randInt(0, viewport.width - 1);
    const cIndex = randInt(0, viewport.height - 1);

    const real = rRange.start + (rIndex * rStepSize);
    const complex = cRange.start + (cIndex * cStepSize);

    const [isInSet, iterationCount] = calcMandlebrotSetStatus(
      real, complex, iterationLimit,
    );
    if (!isInSet) {
      func(iterationCount);
    }
  }
}

// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------

export { buildGetColorFirstPass, buildGetColorFinalPass };
