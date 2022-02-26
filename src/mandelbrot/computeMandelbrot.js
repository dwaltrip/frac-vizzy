import { workerify } from '../lib/workerify';

// `numReal, numComplex` are the real and complex parts of the number
// that is being tested.
// The number being tested is used in place of the constant `c` in the
// special function, f_c(z) = z^2 + c, that is used for iteration.
function calcMandlebrotSetStatus(numReal, numComplex, iterationLimit) {
  const MB_RADIUS = 2; 
  const CRITICAL_POINT_Z = { real: 0, complex: 0 };

  // `current` is the value for `z` as we iterate over the function.
  let currentR = CRITICAL_POINT_Z.real + numReal;
  let currentC = CRITICAL_POINT_Z.complex + numComplex;

  // We iterate over the funciton, f_c(z) = z^2 + c, each time taking the
  // resulting value and plugging back in for `z`.
  // If the value `z` diverges, then the number being tested is not part of
  // of the Mandelbrot set.
  for (let i=0; i<iterationLimit; i++) {

    // These lines calculate `z^2`.
    const z2Real = currentR * currentR - (currentC * currentC);
    const z2Complex = currentR * currentC + (currentC * currentR);

    // These lines calculate `z^2 + c`.
    // This gives us the next value to plug back in as `z`.
    currentR = z2Real + numReal;
    currentC = z2Complex + numComplex;

    // check for bad values
    if (
      (isNaN(currentR) || typeof currentR === 'undefined') ||
      (isNaN(currentC) || typeof currentC === 'undefined')
    ) {
      return {
        isInSet: false,
        iteration: i,
      };
    }

    // check for out of bounds
    if (
      (currentR > 2 || currentR < -2) ||
      (currentC > 2 || currentC < -2)
    ) {
      return {
        isInSet: false,
        iteration: i,
      };
    }
  }

  // Final, more accurate out of bounds check
  if (Math.sqrt(Math.pow(currentR, 2) + Math.pow(currentC, 2)) > MB_RADIUS) {
    return {
      isInSet: false,
      iteration: iterationLimit,
    };
  }

  // If we reach this point, the iterations did not diverge, and the point
  // is considered "in the set". Of course, it may diverge if addtional
  // iterations are performed.
  // I believe it is mathematically impossible to know if a point is truly
  // in the set. It is always "provisional", so to speak.
  return { isInSet: true };
}

function createMandelbrotComputeWorker() {

  // NOTE: `workerCode` is stringified and then called inside a worker.
  // It must fully self-contained without any external references.
  return workerify(
    function workerCode(...args) {
      // TODO: I think I have been drawing it inverted vertically...
      function computeMandlebrotPoints({
        realRange: rRange,
        complexRange: cRange,
        iterationLimit,
        workerOffset,
        numWorkers,
      }) {
        // For each dimension, we loop `numSteps` times. Thus, calculating the
        // `stepSize` this way results in `numSteps` pixels for each dimension,
        // with the first pixel corresponding exactly to the point `range.start`
        // and the last pixel corresponding to the point `range.end`.
        const rStepSize = (rRange.end - rRange.start) / (rRange.numSteps - 1);
        const cStepSize = (cRange.end - cRange.start) / (cRange.numSteps - 1);

        let c = workerOffset;
        while(c < cRange.numSteps) {
          const row = [];

          for (let r=0; r<rRange.numSteps; r++) {
            const real    = rRange.start + (r * rStepSize);
            const complex = cRange.start + (c * cStepSize);
            const status = calcMandlebrotSetStatus(real, complex, iterationLimit);

            row.push({
              isInSet: status.isInSet,
              // NOTE: Add 1 as sometimes it diverges when i=0,
              // which would set `divergenceFactor` to -Infinity, which is bad.
              // For the purposes of calculating the divergenceFactor, there
              // isn't a meaningful difference between iteration values in the
              // interval of [1, iterationLimit] versus [0, iterationLimit - 1].
              divergenceFactor: Math.ceil(Math.log(status.iteration + 1)),
            });
          }

          postMessage({
            label: 'done-computing-tile',
            // data: { y: c, xValues: row },
            data: { tile, pos: { x: ,y : } },
          });

          c += numWorkers;
        }
      }

      return computeMandlebrotPoints(...args);
    },
    [calcMandlebrotSetStatus],
  );
}

export { createMandelbrotComputeWorker, calcMandlebrotSetStatus };
