
function panPlot({ direction, params, viewport, setPlotParams, clamp }) {
  clamp = typeof clamp === 'undefined' ? true : clamp;

  const { dx, dy } = direction;
  const slope = dy / dx;

  let xRatio = dx / viewport.width;
  let yRatio = dy / viewport.height;

  if (clamp && (dx > viewport.width || dy > viewport.height)) {
    // overshooting harder in the x direction
    if (xRatio > yRatio) {
      xRatio = 1;
      yRatio = slope;
    }
    // overshooting harder in the y direction
    else {
      xRatio = 1 / slope;
      yRatio = 1;
    }
  }

  const { centerPos } = params;
  const { realLen, complexLen } = viewport

  setPlotParams({
    centerPos: {
      r: centerPos.r + (xRatio * viewport.realLen),
      c: centerPos.c + (yRatio * viewport.complexLen),
    },
  });
}

export { panPlot };
