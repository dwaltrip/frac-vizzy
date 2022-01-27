
function calcPlotState(canvas, params) {
  const { realRange, complexRange } = params;

  const rLength = realRange.end - realRange.start;
  const cLength = complexRange.end - complexRange.start;
  const rRatio = canvas.width / rLength;
  const cRatio = canvas.height / cLength;

  let plotHeight, plotWidth;

  // the complex-dimension is the constraining one
  if (rRatio > cRatio) {
    const pixelsPerPlotUnit = canvas.height / cLength;
    plotHeight = canvas.height;
    plotWidth = rLength * pixelsPerPlotUnit;
  }
  // the real-dimension is the constraining one
  else {
    const pixelsPerPlotUnit = canvas.width / rLength;
    plotHeight = cLength * pixelsPerPlotUnit;
    plotWidth = canvas.width;
  }

  let topLeft = {
    x: Math.floor((canvas.width - plotWidth) / 2),
    y: Math.floor((canvas.height - plotHeight) / 2),
  }
  const botRight = {
    x: topLeft.x + plotWidth,
    y: topLeft.y + plotHeight,
  };

  return {
    height: plotHeight,
    width: plotWidth,
    topLeft,
    botRight
  };
}

export { calcPlotState };
