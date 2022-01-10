
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor(evt.clientX - rect.left),
    y: Math.floor(evt.clientY - rect.top),
  };
}

export { getMousePos };
