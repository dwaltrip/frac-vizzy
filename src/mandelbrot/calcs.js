
function getSideLength(zoomLevel) {
  return 1 / Math.pow(2, zoomLevel);
}

export {
  getSideLength,
};
