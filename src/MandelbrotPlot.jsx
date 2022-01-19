import React, { useEffect, useRef } from 'react';

import { drawMandelbrot } from './lib/drawMandelbrot';
import { canvasOnClick } from './canvasEvents';

// TODO: my old code doesn't have the thick horizontal line?
// where did that artifact come from??
// UPDATE: it does... need to check old commits to find out when
// it was introduced.
function MandelbrotPlot({ configs, setConfigs }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    console.log('- useEffect - calling drawMandelbrot()');
    drawMandelbrot({ canvas: canvasRef.current, configs, setConfigs });
  }, [configs]);

  return (
    <div className='mandelbrot-plot-container'>
      <canvas
        className='mandelbrot-canvas'
        height='700'
        width='700'
        ref={canvasRef}
        // TODO: Is it fine to allow react to manage our canvas event handling?
        onClick={event => {
          canvasOnClick({
            canvas: canvasRef.current,
            event,
            configs,
            setConfigs,
          });
        }}
      >
      </canvas>
    </div>
  );
}

export { MandelbrotPlot };
