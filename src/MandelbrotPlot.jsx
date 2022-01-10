import React, { useEffect, useRef } from 'react';

import { round } from './lib/round';
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
function MandelbrotPlot({ xRange, yRange, updatePlot }) {
  // console.log('-- MandelbrotPlot -- rendering...');
  return (
    <div className='mandelbrot-plot-container'>
      <div className='coords-display'>
        <span>xRange -- start: {round(xRange.start, 5)}, end: {round(xRange.end, 5)}</span>
        <span>&nbsp;&nbsp;</span>
        <span>yRange -- start: {round(yRange.start, 5)}, end: {round(yRange.end, 5)}</span>
      </div>

      <Canvas
        className='mandelbrot-canvas'
        height='700'
        width='700'
        onmount={({ canvas, ctx })=> {
          console.log('--- plotting.... ---');
          initMandelbrot(canvas, xRange, yRange, updatePlot);
        }}
      />
    </div>
  );
}

export { MandelbrotPlot };
