import React, { useEffect, useRef } from 'react';

import { drawMandelbrot } from './lib/mandelbrot';
import { setupCanvasEvents } from './canvasEvents';

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
function MandelbrotPlot({ configs, setConfigs }) {
  const canvasRef = useRef(null);
  const configsRef = useRef(null);

  // TODO: does this work??
  useEffect(() => {
    console.log('- useEffect - Keeping configsRef up to date...');
    configsRef.current = configs;
  });

  // NOTE: We DO NOT want to depend on `configsRef.current`
  // We only want to run this when the canvas element
  //  is first created.
  // However, `setupCanvasEvents` needs access to the CURRENT configs.
  useEffect(() => {
    console.log('- useEffect - calling setupCanvasEvents')
    const getConfigs = ()=> configsRef.current;
    setupCanvasEvents({ canvas: canvasRef.current, getConfigs, setConfigs });
  }, [canvasRef.current]);

  useEffect(() => {
    console.log('- useEffect - calling drawMandelbrot()');
    drawMandelbrot({ canvas: canvasRef.current, configs, setConfigs });
  }, [configs, canvasRef.current]);

  return (
    <div className='mandelbrot-plot-container'>
      <Canvas
        className='mandelbrot-canvas'
        height='700'
        width='700'
        onmount={({ canvas, ctx })=> {
          canvasRef.current = canvas;
        }}
      />
    </div>
  );
}

export { MandelbrotPlot };
