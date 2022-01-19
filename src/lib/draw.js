
function drawPixel(imageData, x, y, r, g, b) {
  var index = (x + (y * imageData.width)) * 4;

  imageData.data[index + 0] = r;
  imageData.data[index + 1] = g;
  imageData.data[index + 2] = b;
  imageData.data[index + 3] = 255;
}

// TODO: make sure y-axis is not flipped...
function drawPoints(imageData, points, topLeft, colormap) {
  // console.log('-- drawPoints -- Num points:', points.length * (points[0] || []).length);
  const { x: startX, y: startY } = topLeft;
  for (let y=0; y<points.length; y++) {
    const row = points[y];

    for (let x=0; x<row.length; x++) {
      const val = row[x];

      if (!colormap.has(val)) {
        throw new Error(`${val} not in colormap`);
        return;
      }
      else {
        const color = colormap.get(val);
        drawPixel(imageData, startX + x, startY + y, color.r, color.g, color.b);
      }
    }
  }
}

function drawLine(ctx, p1, p2, color, width=2) {
  const preStyle = ctx.strokeStyle 
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a || 1})`;
  ctx.lineWidth = width;
  ctx.beginPath();       // Start a new path
  ctx.moveTo(p1.x, p1.y);    // Move the pen to (30, 50)
  ctx.lineTo(p2.x, p2.y);  // Draw a line to (150, 100)
  ctx.stroke();          // Render the path
  ctx.strokeStyle = preStyle;
}

export { drawPoints, drawLine };
