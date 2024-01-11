// ----------------------------------------------------------------
// TODO: test perf...
// ----------------------------------------------------------------
// Shit... this seems REALLY REALLY SLOW
function rescaleImageData(imgData: ImageData, scale: number) {
  const start = performance.now();
  const oldSize = { width: imgData.width, height: imgData.height };
  console.time('createcanvas 1');
  const old = createCanvas(oldSize.width, oldSize.height);
  console.timeEnd('createcanvas 1');

  const newSize = {
    width: Math.round(oldSize.width * scale),
    height: Math.round(oldSize.height * scale),
  };
  console.time('createcanvas 2');
  const rescaled = createCanvas(newSize.width, newSize.height);
  console.timeEnd('createcanvas 2');

  // Draw on the new canvas with scaling
  console.time('drawimage');
  rescaled.ctx.drawImage(
    old.canvas,
    0,
    0,
    oldSize.width,
    oldSize.height, // src rect
    0,
    0,
    newSize.width,
    newSize.height, // dst rect
  );
  console.timeEnd('drawimage');

  console.time('getImageData');
  const retVal = rescaled.ctx.getImageData(0, 0, newSize.width, newSize.height);
  console.timeEnd('getImageData');
  const end = performance.now();
  console.log('\trescaleImageData -- time:', (end - start).toFixed(4), 'ms');
  return retVal;
}

function createCanvas(
  width: number,
  height: number,
): {
  canvas: OffscreenCanvas;
  ctx: OffscreenCanvasRenderingContext2D;
} {
  const canvas = new OffscreenCanvas(width, height);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');
  return { canvas, ctx };
}

export { rescaleImageData };
