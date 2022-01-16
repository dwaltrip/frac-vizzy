import { getMousePos } from './lib/getMousePos';
import { calcPlotState } from './state/plot';

const CANVAS_ZOOM_FACTOR = 4;

function setupCanvasEvents({ canvas, getConfigs, setConfigs }) {
  canvas.addEventListener('click', event => {
    console.log('======= canvas onclick -- start =======');
    const mousePos = getMousePos(canvas, event);
    console.log('\tmousePos:', mousePos);

    const configs = getConfigs();
    const { realRange, complexRange } = configs;

    const plot = calcPlotState(canvas, configs);

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

    setConfigs({
      realRange: {
        start: newCenter.x - (xLen / 2),
        end: newCenter.x + (xLen / 2),
        // start: round(newCenter.x - (xLen / 2), 10),
        // end: round(newCenter.x + (xLen / 2), 10),
      },
      complexRange: {
        start: newCenter.y - (yLen / 2),
        end: newCenter.y + (yLen / 2),
        // start: round(newCenter.y - (yLen / 2), 10),
        // end: round(newCenter.y + (yLen / 2), 10),
      },
    });
  });
}

export { setupCanvasEvents };
