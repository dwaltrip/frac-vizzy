import React, { useEffect, useRef, useState } from 'react';

import './styles/MandelbrotPlot.css';

import { throttle } from './lib/throttle';
import { ResponsiveCanvas } from './ui/ResponsiveCanvas';

import { areParamsReady } from './plotParams';
import { drawMandelbrot } from './mandelbrot/drawMandelbrot';
import { zoomInPlot, zoomOutPlot } from './canvasEvents';

// TODO: my old code doesn't have the thick horizontal line?
// where did that artifact come from??
// UPDATE: it does... need to check old commits to find out when
// it was introduced.
function MandelbrotPlot({
  params,
  setPlotParams,
  systemParams,
  viewportRect,
  setViewportRect,
}) {
  const canvasRef = useRef(null);
  const [percentComplete, setPercentComplete] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  function drawMandelbrotWithProgressUpdates() {
    setIsCalculating(true);
    setPercentComplete(0);
    const setPercentCompleteThrottled = throttle(setPercentComplete, 125);

    drawMandelbrot({
      canvas: canvasRef.current,
      params,
      systemParams, // TODO: This is kind of like prop-drilling... improve it?
      onProgress: percent => setPercentCompleteThrottled(percent),
    }).then(() => {
      setIsCalculating(false);
      setPercentComplete(100);
    });
  }

  function onCanvasResize() {
    const canvas = canvasRef.current;
    const viewportRect = { height: canvas.height, width: canvas.width };
    setViewportRect(viewportRect);
  }

  // Redraw mandlebrot plot if the params change or the viewport size changes.
  useEffect(() => {
    if (areParamsReady(params)) {
      drawMandelbrotWithProgressUpdates();
    }
  }, [params, viewportRect]);

  return (
    <div className='mandelbrot-plot-container'>
      <div className='computation-status'>
        <span className='status-msg'>
          {isCalculating ?
            `Working... ${percentComplete}%` :
            `Done calculating!`
          }
        </span>
      </div>

      <ResponsiveCanvas
        className='mandelbrot-canvas'
        ref={canvasRef}
        onResize={onCanvasResize}
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
      />
    </div>
  );
}

export { MandelbrotPlot };
