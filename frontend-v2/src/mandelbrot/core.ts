import {
  ComplexNum,
  SetStatus,
  RegionData,
  PartialRegionData,
  PixelCoord,
} from '@/mandelbrot/types';

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
  numSteps: { re: number; im: number },
  unitsPerPixel: number,
  iterLimit: number,
): RegionData {
  if (!Number.isInteger(numSteps.re) || !Number.isInteger(numSteps.im)) {
    throw new TypeError('steps must be integers');
  }
  const getStatus = (point: ComplexNum) => computeSetStatus(point, iterLimit);
  return mapPointsInRegion(topLeft, numSteps, unitsPerPixel, getStatus);
}

function computeRegionPointsConditionally(
  topLeft: ComplexNum,
  numSteps: { re: number; im: number },
  unitsPerPixel: number,
  iterLimit: number,
  shouldComputePoint: (c: ComplexNum, p: PixelCoord) => boolean,
): PartialRegionData {
  const getStatusMaybe = (point: ComplexNum, pixel: PixelCoord) => {
    const shouldCompute = shouldComputePoint(point, pixel);
    return shouldCompute ? computeSetStatus(point, iterLimit) : null;
  };
  return mapPointsInRegion(topLeft, numSteps, unitsPerPixel, getStatusMaybe);
}

function mapPointsInRegion<T>(
  topLeft: ComplexNum,
  numSteps: { re: number; im: number },
  unitsPerPixel: number,
  mapFn: (point: ComplexNum, coord: PixelCoord) => T,
): T[][] {
  const points: T[][] = [];
  for (let y = 0; y < numSteps.im; y++) {
    const row: T[] = [];
    for (let x = 0; x < numSteps.re; x++) {
      const re = topLeft.re + x * unitsPerPixel;
      const im = topLeft.im - y * unitsPerPixel;
      row.push(mapFn({ re, im }, { x, y }));
    }
    points.push(row);
  }
  return points;
}

// // -----------------------------------------------------------------------------
// // Cool generator function that could be useful if we need to do different kinds
// // of calculations with the points in a region.
// // There's a few cases where I could see this happening.
// // E.g. An optimization where we use a small subset of points to estimate if the
// //  tile is fully in the set. If so, we skip calculating the rest of the points.
// // For now it's not needed, but I'm keeping it here commented out for reference.
// // If I don't end up using it, I should delete this at some point.
// // -----------------------------------------------------------------------------
// function* pointsInRegion(
//   topLeft: ComplexNum,
//   numSteps: { re: number; im: number },
//   unitsPerPixel: number,
// ): Generator<[ComplexNum, PixelCoord]> {
//   for (let i = 0; i < numSteps.im; i++) {
//     for (let r = 0; r < numSteps.re; r++) {
//       const re = topLeft.re + r * unitsPerPixel;
//       const im = topLeft.im - i * unitsPerPixel;
//       yield [{ re, im }, { x: r, y: i }];
//     }
//   }
// }

export { computeRegion, computeRegionPointsConditionally, type SetStatus };
