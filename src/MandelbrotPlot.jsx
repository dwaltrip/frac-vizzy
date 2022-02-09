import React, { useEffect, useRef, useState } from 'react';

import './styles/MandelbrotPlot.css';

import { drawMandelbrot } from './mandelbrot/drawMandelbrot';
import { useThrottledValue } from './lib/useThrottledValue';
import { zoomInPlot, zoomOutPlot } from './canvasEvents';

// TODO: my old code doesn't have the thick horizontal line?
// where did that artifact come from??
// UPDATE: it does... need to check old commits to find out when
// it was introduced.
function MandelbrotPlot({ params, setPlotParams }) {
  const canvasRef = useRef(null);
  const [percentComplete, setPercentComplete] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setIsCalculating(true);
    setPercentComplete(0);
    drawMandelbrot({
      canvas: canvasRef.current,
      params,
      onProgress: percent => setPercentComplete(percent),
    }).then(() => {
      setIsCalculating(false);
      setPercentComplete(100);
    });
  }, [params]);

  const percentCompleteThrottled = useThrottledValue(percentComplete, 125);

  return (
    <div className='mandelbrot-plot-container'>
      <div className='computation-status'>
        <span className='status-msg'>
          {isCalculating ?
            `Working... ${percentCompleteThrottled}%` :
            `Done calculating!`
          }
        </span>
      </div>

      <canvas
        className='mandelbrot-canvas'
        height='700'
        width='700'
        ref={canvasRef}
        // onClick={() => console.log('-- canvas event -- onClick')}
        // onMouseDown={() => console.log('.. canvas mousedown')}
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
