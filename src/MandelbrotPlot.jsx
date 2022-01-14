import React, { useEffect, useRef } from 'react';

import { initMandelbrot } from './lib/mandelbrot';

function Canvas({ onmount, ...props }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    onmount && onmount({ canvas, ctx });
  }, []);

  return (
    <canvas ref={canvasRef} {...props}>
    </canvas>
  );
}

// TODO: my old code doesn't have the thick horizontal line?
// where did that artifact come from??
// UPDATE: it does... need to check old commits to find out when
// it was introduced.
function MandelbrotPlot({ xRange, yRange, updateConfigs }) {
  console.log('-- MandelbrotPlot -- rendering...');
  return (
    <div className='mandelbrot-plot-container'>
      <Canvas
        className='mandelbrot-canvas'
        height='700'
        width='700'
        onmount={({ canvas, ctx })=> {
          console.log('--- plotting.... ---');
          initMandelbrot(canvas, xRange, yRange, updateConfigs);
        }}
      />
    </div>
  );
}

export { MandelbrotPlot };
