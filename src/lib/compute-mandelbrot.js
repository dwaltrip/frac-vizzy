
// Mandlebrot set inclusion radius
const MB_RADIUS = 2; 

const CRITICAL_POINT_Z = { real: 0, complex: 0 };

// -----------------------------------------------------------------------------

function isInMandlebrotSet(num_real, num_complex, bailout_limit) {
  let current_r = CRITICAL_POINT_Z.real + num_real;
  let current_c = CRITICAL_POINT_Z.complex + num_complex;

  for (let i=0; i<bailout_limit; i++) {
    // check for bad values
    if (
      (isNaN(current_r) || typeof current_r === 'undefined') ||
      (isNaN(current_c) || typeof current_c === 'undefined')
    ) {
      return false;
    }

    // check for out of bounds
    if (
      (current_r > 2 || current_r < -2) ||
      (current_c > 2 || current_c < -2)
    ) {
      return false;
    }

    // Iterate!
    // f_c(z) = z^2 + c;
    const z2_real = current_r * current_r - (current_c * current_c);
    const z2_complex = current_r * current_c + (current_c * current_r);
    current_r = num_real + z2_real;
    current_c = num_complex + z2_complex;
  }

  // Final, more accurate out of bounds check
  if (Math.sqrt(Math.pow(current_r, 2) + Math.pow(current_c, 2)) > MB_RADIUS) {
    return false;
  }

  return true;
}

// -----------------------------------------------------------------------------

// TODO: I think I have been drawing it inverted vertically...
function computeMandlebrotPoints({
  real_range: r_range,
  complex_range: c_range,
  bailout_limit,
}) {
  const r_step_size = (r_range.end - r_range.start) / r_range.num_steps;
  const c_step_size = (c_range.end - c_range.start) / c_range.num_steps;
  // console.log('r_step_size:', r_step_size);
  // console.log('c_step_size:', c_step_size);

  const points = [];

  for (let i=0; i<c_range.num_steps; i++) {
    points.push([]);
  }

  let pointsInSetCount = 0;

  for (let c=0; c<c_range.num_steps; c++) {
    for (let r=0; r<r_range.num_steps; r++) {
      const real    = r_range.start + (r * r_step_size);
      const complex = c_range.start + (c * c_step_size);

      if (isInMandlebrotSet(real, complex, bailout_limit)) {
        pointsInSetCount++;
        points[c].push(1);
      } else {
        points[c].push(0);
      }
    }
  }

  // console.log(`Num points in set: ${pointsInSetCount}`);
  return points;
}

export { computeMandlebrotPoints };
