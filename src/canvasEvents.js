import { getMousePos } from './lib/getMousePos';
import { truncateRange } from './lib/truncateRange';

import { TILE_SIDE_LENGTH_IN_PIXELS } from './settings';

// NOTE: This needs a be a positive integer
const CANVAS_ZOOM_FACTOR = 2;

function zoomInPlot({ canvas, event, params, setPlotParams }) {
  console.log('======= zoomInPlot -- start =======');
  const mousePos = getMousePos(canvas, event);
  console.log('\tmousePos:', mousePos);

  const { centerPos, zoomLevel } = params;
  // TODO: we are doing this calc in multiple places... should have a single
  // func that defines this.
  const sideLength = 1 / Math.pow(2, zoomLevel);

  const rLen = (canvas.width / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;
  const cLen = (canvas.height / TILE_SIDE_LENGTH_IN_PIXELS) * sideLength;

  const topLeftPoint = {
    r: centerPos.r - (rLen / 2),
    c: centerPos.c + (cLen / 2),
  };

  // TODO: can I make this cleaner / less bug-prone?
  const xRatio = mousePos.x / canvas.width;
  const yRatio = mousePos.y / canvas.height;

  const newCenter = {
    r: topLeftPoint.r + (xRatio * rLen),
    c: topLeftPoint.c - (yRatio * cLen),
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
