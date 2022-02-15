import { randInt } from '../lib/randInt';

function buildColorMap({
  realRange: rRange,
  complexRange: cRange,
  iterationLimit,
}) {
  const numPixels = rRange.numSteps * cRange.numSteps;
  const numSamples = Math.floor(numPixels / 1000);

  const rStepSize = (rRange.end - rRange.start) / rRange.numSteps;
  const cStepSize = (cRange.end - cRange.start) / cRange.numSteps;


  let maxDivergenceFactor = 0;
  // TODO: Is this consistent enough?
  // I would MUCH MUCH prefer a deterministic approach.
  for(let i=0; i<numSamples; i++) {
    const rIndex = randInt(0, rRange.numSteps - 1);
    const cIndex = randInt(0, cRange.numSteps - 1);
    const real = rRange.start + (rIndex * rStepSize);
    const complex = cRange.start + (cIndex * cStepSize);

    const status = calcMandlebrotSetStatus(real, complex, iterationLimit);
    const divergenceFactor = Math.ceil(Math.log(status.iteration));
    maxDivergenceFactor = Math.max(divergenceFactor, maxDivergenceFactor);
  }

  // const bgColor = { r: 247, g: 243, b: 238 };
  // const bgColor = { r: 227, g: 223, b: 228 };
  const bgColor = { r: 220, g: 230, b: 255 };
  const lightenTo = 0.55;
  // const lightenTo = 0.85;
  let colorRange = {
    start: {
      r: bgColor.r * lightenTo,
      g: bgColor.g * lightenTo,
      b: bgColor.b * lightenTo,
    },
    end: bgColor,
  };

  const colorMap = new Map([
    [-1, { r: 0, g: 0, b: 0 }],
  ]);

  for (let i=0; i<=maxDivergenceFactor; i++) {
    const percent = i / maxDivergenceFactor;
    const r = percentToRangeVal(percent, colorRange.start.r, colorRange.end.r);
    const g = percentToRangeVal(percent, colorRange.start.g, colorRange.end.g);
    const b = percentToRangeVal(percent, colorRange.start.b, colorRange.end.b);
    colorMap.set(i, { r, g, b });
  }

  // console.log('colorMap:', colorMap);
  return colorMap;
}

function percentToRangeVal(percent, start, end) {
  return Math.floor(start + (percent * (end - start)));
}

export { buildColorMap };
