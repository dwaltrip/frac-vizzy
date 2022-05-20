import { workerify } from 'lib/workerify';

import { TILE_SIDE_LENGTH_IN_PIXELS } from 'settings';

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
      return [false, i];
    }

    // check for out of bounds
    if (
      (currentR > 2 || currentR < -2) ||
      (currentC > 2 || currentC < -2)
    ) {
      return [false, i];
    }
  }

  // Final, more accurate out of bounds check
  if (Math.sqrt(Math.pow(currentR, 2) + Math.pow(currentC, 2)) > MB_RADIUS) {
    return [false, iterationLimit];
  }

  // If we reach this point, the iterations did not diverge, and the point
  // is considered "in the set". Of course, it may diverge if addtional
  // iterations are performed.
  // I believe it is mathematically impossible to know if a point is truly
  // in the set. It is always "provisional", so to speak.
  return [true, -1];
}

function createMandelbrotComputeWorker() {

  // NOTE: `workerCode` is stringified and then called inside a worker.
  // It must fully self-contained without any external references.
  return workerify(
    function workerCode() {
      function computeTile(tile, iterationLimit) {
        const { topLeftPoint, sideLength } = tile;
        // Declare global so eslint doesn't get angry
        /* global $TILE_SIDE_LENGTH_IN_PIXELS */
        const numSteps = $TILE_SIDE_LENGTH_IN_PIXELS;

        const dr = sideLength / numSteps;
        const dc = dr;

        let points = [];

        // TODO: Double check that I'm not accidentally flipping it verticallyl
        for (let cStep=0; cStep<numSteps; cStep++) {
          let row = [];

          for (let rStep=0; rStep<numSteps; rStep++) {
            const real    = topLeftPoint.r + (rStep * dr);
            const complex = topLeftPoint.c - (cStep * dc);
            row.push(calcMandlebrotSetStatus(real, complex, iterationLimit));
          }

          points.push(row);
        }

        return points;
      }

      addEventListener('message', (event) => {
        const { type, args: { tileId, iterationLimit } } = event.data;

        if (type === 'compute-tile') {
          const points = computeTile(tileId, iterationLimit);

          postMessage({
            label: 'done-computing-tile',
            data: { tileId, points },
          });
        }
      });
    },
    [
      calcMandlebrotSetStatus,
    ],
    {
      // I had to use a different name to due to some webpack nonsense.
      '$TILE_SIDE_LENGTH_IN_PIXELS': TILE_SIDE_LENGTH_IN_PIXELS,
    }
  );
}

export { createMandelbrotComputeWorker, calcMandlebrotSetStatus };
