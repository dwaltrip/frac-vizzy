import React, { useEffect, useRef, useState } from 'react';

import './styles/MandelbrotPlot.css';

import { throttle } from './lib/throttle';

import { areParamsReady } from './plotParams';

import { drawMandelbrot } from './mandelbrot/drawMandelbrot';
import { panPlot } from './mandelbrot/plotActions';
import { ComputeManager } from './mandelbrot/computeManager';

import { zoomInPlot, zoomOutPlot } from './canvasEvents';
import { getViewportInfo } from './viewport';
import { Pannable } from './ui/Pannable';
import { ResponsiveCanvas } from './ui/ResponsiveCanvas';

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
      ComputeManager,
      onProgress: percent => setPercentCompleteThrottled(percent),
    }).then(() => {
      setIsCalculating(false);
      setPercentComplete(100);
    });
  }

  useEffect(() => {
    ComputeManager.updateNumWorkers(systemParams.numWorkers);
  }, [systemParams])

  function onCanvasResize() {
    const canvas = canvasRef.current;
    setViewportRect({ height: canvas.height, width: canvas.width });
  }

  // Redraw mandlebrot plot if the params change or the viewport size changes.
  useEffect(() => {
    if (areParamsReady(params)) {
      drawMandelbrotWithProgressUpdates();
    }
  }, [params, viewportRect]);

  // ----------------------------------------------------------------
  // TODO: The panning is not quite as smooth / nice as I would like
  // It works decently well, but I think it could be better.
  // ----------------------------------------------------------------
  const onPan = panVector => {
    const direction = {
      dx: panVector.x,
      // y-axis pos / neg is flipped for pixel coords vs. complex coords
      dy: -1 * panVector.y,
    };
    const viewport = getViewportInfo(params, canvasRef.current);
    panPlot({ direction, params, viewport, setPlotParams })
  };

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

      <div
        className='plot-overlay'
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
        <Pannable onPan={onPan} throttleDelay={100}>
          <ResponsiveCanvas
            className='mandelbrot-canvas'
            ref={canvasRef}
            onResize={onCanvasResize}
          />
        </Pannable>
      </div>
    </div>
  );
}

export { MandelbrotPlot };
