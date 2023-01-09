import { getMousePos } from 'lib/getMousePos';
import { truncateRange } from 'lib/truncateRange';

import { getViewportInfo } from 'mandelbrot/viewport';

// NOTE: This needs a be a positive integer
const CANVAS_ZOOM_FACTOR = 2;

function zoomInPlot({ canvas, event, params, setPlotParams }) {
  console.log('======= zoomInPlot -- start =======');
  const mousePos = getMousePos(event);

  const { centerPos, zoomLevel } = params;
  const viewport = getViewportInfo(params, canvas);

  const rRatio = mousePos.x / canvas.width;
  const cRatio = mousePos.y / canvas.height;

  const newCenter = {
    r: viewport.topLeftPoint.r + (rRatio * viewport.realLen),
    c: viewport.topLeftPoint.c - (cRatio * viewport.complexLen),
  };

  setPlotParams({
    centerPos: newCenter,
    zoomLevel: zoomLevel + CANVAS_ZOOM_FACTOR,
  });
}

// TODO: set max zoom? will depend on canvas size.
function zoomOutPlot({ canvas, event, params, setPlotParams }) {
  console.log('======= zoomOutPlot -- start =======');
  setPlotParams({
    zoomLevel: params.zoomLevel - CANVAS_ZOOM_FACTOR,
  });
}

export { zoomInPlot, zoomOutPlot };
