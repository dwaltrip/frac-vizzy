import React, { useEffect, useRef } from 'react';

import { drawMandelbrot } from './lib/mandelbrot';

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
function MandelbrotPlot({ xRange, yRange }) {
  return (
    <div className='mandelbrot-plot-container'>
      <Canvas
        className='mandelbrot-canvas'
        height='600'
        width='800'
        onmount={({ canvas, ctx })=> {
          console.log('--- plotting.... ---')
          drawMandelbrot(canvas, xRange, yRange);
        }}
      />
    </div>
  );
}

export { MandelbrotPlot };
