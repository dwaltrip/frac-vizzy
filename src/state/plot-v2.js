
// E.g. the viewport should be roughly close to a 4x4 tile grid.
// TODO: Error on the side of more tiles or less?
const TARGET_TILES_PER_DIMENSION = 4;

// TODO: this needs to be based off of `params.zoomLevel`
function calcPlotState(canvas, params) {
  const { realRange, complexRange, zoomLevel } = params;

  const tileSideLength = 1 * Math.pow(2, zoomLevel);

  const rLength = realRange.end - realRange.start;
  const cLength = complexRange.end - complexRange.start;


  return {
    topLeftTile: ,
    topLeftPixelOffset: {
      dx:,
      dy:
    },
  };
  // return {
  //   height: plotHeight,
  //   width: plotWidth,
  //   topLeft,
  //   botRight
  // };
}

export { calcPlotState };
