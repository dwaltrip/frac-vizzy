
// NOTE: topleft corner of DOM element is (0, 0)
function getMousePos(event) {
  var rect = event.target.getBoundingClientRect();
  return {
    x: Math.floor(event.clientX - rect.left),
    y: Math.floor(event.clientY - rect.top),
  };
}

export { getMousePos };
