import React, { useEffect, useRef } from 'react';

import { drawMandelbrot } from './lib/drawMandelbrot';
import { zoomInPlot, zoomOutPlot } from './canvasEvents';

// TODO: my old code doesn't have the thick horizontal line?
// where did that artifact come from??
// UPDATE: it does... need to check old commits to find out when
// it was introduced.
function MandelbrotPlot({ params, setPlotParams }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawMandelbrot({ canvas: canvasRef.current, params });
  }, [params]);

  return (
    <div className='mandelbrot-plot-container'>
      <canvas
        className='mandelbrot-canvas'
        height='700'
        width='700'
        ref={canvasRef}
        // TODO: Is it fine to allow react to manage our canvas event handling?
        onDoubleClick={event => {
          zoomInPlot({
            canvas: canvasRef.current,
            event,
            params,
            setPlotParams,
          });
        }}
        onContextMenu={event => {
          event.preventDefault();
          zoomOutPlot({
            canvas: canvasRef.current,
            event,
            params,
            setPlotParams,
          });
        }}
      >
      </canvas>
    </div>
  );
}

export { MandelbrotPlot };
