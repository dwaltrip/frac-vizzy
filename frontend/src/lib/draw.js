
function drawPixel(imageData, x, y, r, g, b) {
  var index = (x + (y * imageData.width)) * 4;

  imageData.data[index + 0] = r;
  imageData.data[index + 1] = g;
  imageData.data[index + 2] = b;
  imageData.data[index + 3] = 255;
}

// NOTE: this currently isn't used anywhere but I used it for debugging before.
function drawLine(ctx, p1, p2, color, width=1) {
  const preStyle = ctx.strokeStyle 
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a || 1})`;
  ctx.lineWidth = width;
  ctx.beginPath();       // Start a new path
  ctx.moveTo(p1.x, p1.y);    // Move the pen to (30, 50)
  ctx.lineTo(p2.x, p2.y);  // Draw a line to (150, 100)
  ctx.stroke();          // Render the path
  ctx.strokeStyle = preStyle;
}

export { drawPixel, drawLine };
