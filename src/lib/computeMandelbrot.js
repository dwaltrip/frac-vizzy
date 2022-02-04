// TODO: move from lib/ to mandelbrot/

import { workerify } from './workerify';

function createMandelbrotComputeWorker() {

  // NOTE: `workerCode` is stringified and then called inside a worker.
  // It must fully self-contained without any external references.
  return workerify(function workerCode(...args) {

    // Mandlebrot set inclusion radius
    const MB_RADIUS = 2; 
    const CRITICAL_POINT_Z = { real: 0, complex: 0 };

    function calcMandlebrotSetStatus(num_real, num_complex, iteration_limit) {
      let current_r = CRITICAL_POINT_Z.real + num_real;
      let current_c = CRITICAL_POINT_Z.complex + num_complex;

      for (let i=0; i<iteration_limit; i++) {
        // check for bad values
        if (
          (isNaN(current_r) || typeof current_r === 'undefined') ||
          (isNaN(current_c) || typeof current_c === 'undefined')
        ) {
          return {
            isInSet: false,
            iteration: i,
          };
        }

        // check for out of bounds
        if (
          (current_r > 2 || current_r < -2) ||
          (current_c > 2 || current_c < -2)
        ) {
          return {
            isInSet: false,
            iteration: i,
          };
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
        return {
          isInSet: false,
          iteration: iteration_limit,
        };
      }

      return { isInSet: true };
    }

    // -----------------------------------------------------------------------------

    // TODO: I think I have been drawing it inverted vertically...
    function computeMandlebrotPoints({
      real_range: r_range,
      complex_range: c_range,
      iteration_limit,
    }) {
      const r_step_size = (r_range.end - r_range.start) / r_range.num_steps;
      const c_step_size = (c_range.end - c_range.start) / c_range.num_steps;

      const points = [];

      for (let i=0; i<c_range.num_steps; i++) {
        points.push([]);
      }

      const totalIterations = c_range.num_steps * r_range.num_steps;
      const onePercentOfTotalIters = Math.ceil(totalIterations / 100);
      let iterCount = 0;

      for (let c=0; c<c_range.num_steps; c++) {
        for (let r=0; r<r_range.num_steps; r++) {
          const real    = r_range.start + (r * r_step_size);
          const complex = c_range.start + (c * c_step_size);

          const status = calcMandlebrotSetStatus(real, complex, iteration_limit);
          points[c].push({
            isInSet: status.isInSet,
            divergenceFactor: Math.ceil(Math.log(status.iteration)),
          });

          iterCount++;
          if (iterCount % onePercentOfTotalIters === 0) {
            postMessage({
              label: 'progress-update',
              percentComplete: Math.floor(100 * (iterCount / totalIterations)),
            })
          }
        }
      }

      return points;
    }

    return computeMandlebrotPoints(...args);
  });
}

export { createMandelbrotComputeWorker };
