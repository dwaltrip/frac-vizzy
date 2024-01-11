import { ComplexNum, SetStatus } from '@/mandelbrot/types';

const MB_RADIUS = 2;
const CRITICAL_POINT_Z = { re: 0, im: 0 };

function makeSetStatus(isInSet: boolean, iters: number): SetStatus {
  return { isInSet, iters };
}

function computeSetStatus(c: ComplexNum, iterLimit: number): SetStatus {
  const cRe = c.re;
  const cIm = c.im;

  // Initial value for `z`, from which we will iterate over the function with.
  // We use separate variables instead of creating an object for performance reasons.
  let zRe = CRITICAL_POINT_Z.re + cRe;
  let zIm = CRITICAL_POINT_Z.im + cIm;

  // We iterate over the funciton, f_c(z) = z^2 + c, each time taking the
  // resulting value and plugging back in for `z`.
  // If the value `z` diverges, then the number being tested is not part of
  // of the Mandelbrot set.
  for (let i = 0; i < iterLimit; i++) {
    // calculate `z^2`
    const z2Re = zRe * zRe - zIm * zIm;
    const z2Im = zRe * zIm + zIm * zRe;

    // calculate `z^2 + c`, and assign to `z` for next iteration
    zRe = z2Re + cRe;
    zIm = z2Im + cIm;

    // check for bad values
    if (
      isNaN(zRe) ||
      typeof zRe === 'undefined' ||
      isNaN(zIm) ||
      typeof zIm === 'undefined'
    ) {
      return makeSetStatus(false, i);
    }

    // check for out of bounds
    if (zRe > 2 || zRe < -2 || zIm > 2 || zIm < -2) {
      return makeSetStatus(false, i);
    }
  }

  // final, more accurate out of bounds check
  if (Math.sqrt(Math.pow(zRe, 2) + Math.pow(zIm, 2)) > MB_RADIUS) {
    return makeSetStatus(false, iterLimit);
  }

  // If we reach this point, the iterations did not diverge, and the point
  // is considered "in the set". Of course, it may diverge if addtional
  // iterations are performed.
  return makeSetStatus(true, -1);
}

function computeRegion(
  topLeft: ComplexNum,
  steps: { re: number; im: number },
  // Question: Can I use Typescript to distinguish mathToPx from arbitrary numbers?
  pxToMath: number,
  iterLimit: number,
): SetStatus[][] {
  if (!Number.isInteger(steps.re) || !Number.isInteger(steps.im)) {
    throw new TypeError('steps must be integers');
  }

  const points = [];
  for (let i = 0; i < steps.im; i++) {
    const row = [];
    for (let r = 0; r < steps.re; r++) {
      const re = topLeft.re + r * pxToMath;
      const im = topLeft.im - i * pxToMath;
      row.push(computeSetStatus({ re, im }, iterLimit));
    }
    points.push(row);
  }
  return points;
}

export { computeRegion, type SetStatus };
