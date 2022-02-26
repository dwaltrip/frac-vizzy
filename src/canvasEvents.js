import { getMousePos } from './lib/getMousePos';
import { truncateRange } from './lib/truncateRange';

import { calcPlotState } from './state/plot';

// NOTE: this needs to be a multiple of 2!
const CANVAS_ZOOM_FACTOR = 4;

function zoomInPlot({ canvas, event, params, setPlotParams }) {
  console.log('======= zoomInPlot -- start =======');
  const mousePos = getMousePos(canvas, event);
  console.log('\tmousePos:', mousePos);

  const { realRange, complexRange, zoomLevel } = params;
  const plot = calcPlotState(canvas, params);

  const rLength = realRange.end - realRange.start;
  const cLength = complexRange.end - complexRange.start;

  if (
    (mousePos.x < plot.topLeft.x || mousePos.x > plot.botRight.x) ||
    (mousePos.y < plot.topLeft.y || mousePos.y > plot.botRight.y)
  ) {
    console.log('\tinvalid pos!');
    return;
  }

  // TODO: can I make this cleaner / less bug-prone?
  const xRatio = (mousePos.x - plot.topLeft.x) / plot.width;
  const yRatio = (mousePos.y - plot.topLeft.y) / plot.height;

  const newCenter = {
    x: realRange.start + (xRatio * rLength),
    y: complexRange.start + (yRatio * cLength),
  };

  console.log('\tnewCenter:', newCenter);

  const xLen = rLength / CANVAS_ZOOM_FACTOR;
  const yLen = cLength / CANVAS_ZOOM_FACTOR;

  setPlotParams({
    realRange: truncateRange({
      start: newCenter.x - (xLen / 2),
      end: newCenter.x + (xLen / 2),
    }, 0.001),
    complexRange: truncateRange({
      start: newCenter.y - (yLen / 2),
      end: newCenter.y + (yLen / 2),
    }, .001),
    zoomLevel: zoomLevel * CANVAS_ZOOM_FACTOR,
  });
}

// TODO: set max zoom by constraining realRange, complexRange, and zoomLevel
function zoomOutPlot({ canvas, event, params, setPlotParams }) {
  console.log('======= zoomOutPlot -- start =======');

  const plot = calcPlotState(canvas, params);
  const mousePos = getMousePos(canvas, event);

  if (
    (mousePos.x < plot.topLeft.x || mousePos.x > plot.botRight.x) ||
    (mousePos.y < plot.topLeft.y || mousePos.y > plot.botRight.y)
  ) {
    console.log('\tinvalid pos!');
    return;
  }

  const { realRange, complexRange, zoomLevel } = params;

  const rLength = realRange.end - realRange.start;
  const cLength = complexRange.end - complexRange.start;

  const center = {
    r: realRange.start + (rLength / 2),
    c: complexRange.start + (cLength / 2),
  };

  const newRLength = rLength * CANVAS_ZOOM_FACTOR;
  const newCLength = cLength * CANVAS_ZOOM_FACTOR;

  setPlotParams({
    realRange: truncateRange({
      start: center.r - (newRLength / 2),
      end: center.r + (newRLength / 2),
    }, 0.001),
    complexRange: truncateRange({
      start: center.c - (newCLength / 2),
      end: center.c + (newCLength / 2),
    }, .001),
    zoomLevel: zoomLevel / CANVAS_ZOOM_FACTOR,
  });
}

export { zoomInPlot, zoomOutPlot };
