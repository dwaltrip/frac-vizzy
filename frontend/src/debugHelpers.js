
function getAxesInPixelCoords(viewport) {
  const { topLeftPoint, botRightPoint } = viewport;
  const vp = viewport;
  if (
    !(topLeftPoint.r < 0 && 0 < botRightPoint.r) ||
    !(topLeftPoint.c > 0 && 0 > botRightPoint.c)
  ) {
    // origin isn't currently visible.
    return null;
  }

  const origin = {
    x: Math.round(-1 * (topLeftPoint.r / vp.realLen) * vp.width),
    y: Math.round((topLeftPoint.c / vp.complexLen) * vp.height),
  };

  if (!origin) {
    return { realAxis: null, complexAxis: null };
  }

  return {
    rAxis: { a: { y: origin.y, x: 0 }, b: { y: origin.y, x: vp.width } },
    cAxis: { a: { x: origin.x, y: 0 }, b: { x: origin.x, y: vp.height } },
  };
}

export { getAxesInPixelCoords };
