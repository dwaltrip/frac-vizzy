
// NOTE: topleft corner of DOM element is (0, 0)
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor(evt.clientX - rect.left),
    y: Math.floor(evt.clientY - rect.top),
  };
}

export { getMousePos };
