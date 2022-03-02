import { getMousePos } from './lib/getMousePos';
import { truncateRange } from './lib/truncateRange';

import { TILE_SIDE_LENGTH_IN_PIXELS } from './settings';

// NOTE: this needs to be a multiple of 2!
const CANVAS_ZOOM_FACTOR = 4;

function zoomInPlot({ canvas, event, params, setPlotParams }) {
  console.log('======= zoomInPlot -- start =======');
  const mousePos = getMousePos(canvas, event);
  console.log('\tmousePos:', mousePos);

  const { centerPos, zoomLevel } = params;

  const xLen = (canvas.width / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;
  const yLen = (canvas.height / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;

  const topLeftPoint = {
    x: center.x - (xLen / 2),
    y: center.y + (yLen / 2),
  };

  // TODO: can I make this cleaner / less bug-prone?
  const xRatio = mousePos.x / canvas.width;
  const yRatio = mousePos.y / canvas.height;

  const newCenter = {
    x: topLeftPoint.x + (xRatio * xLen),
    y: topLeftPoint.y - (yRatio * yLen),
  };

  console.log('\tnewCenter:', newCenter);

  setPlotParams({
    centerPos: newCenter,
    zoomLevel: zoomLevel * CANVAS_ZOOM_FACTOR,
  });
}

// TODO: set max zoom? will depend on canvas size.
function zoomOutPlot({ canvas, event, params, setPlotParams }) {
  console.log('======= zoomOutPlot -- start =======');
  setPlotParams({
    zoomLevel: params.zoomLevel / CANVAS_ZOOM_FACTOR,
  });
}

export { zoomInPlot, zoomOutPlot };
