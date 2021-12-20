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

function MandelbrotPlot() {
  return (
    <div className='mandelbrot-plot-container'>
      <Canvas
        className='mandelbrot-canvas'
        height='600'
        width='600'
        onmount={({ canvas, ctx })=> {
          console.log('--- plotting.... ---')
          drawMandelbrot(canvas);
        }}
      />
    </div>
  );
}

export { MandelbrotPlot };
