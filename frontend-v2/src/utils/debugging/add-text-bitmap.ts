async function addTextToBitmap(
  imageBitmap: ImageBitmap,
  text: string,
  fontStyle = '10px Arial',
  fillStyle = 'red',
): Promise<ImageBitmap> {
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');
  ctx.drawImage(imageBitmap, 0, 0);

  ctx.font = fontStyle;
  ctx.fillStyle = fillStyle;
  ctx.fillText(text, 5, 10);

  // Return new ImageBitmap
  return createImageBitmap(canvas);
}

export { addTextToBitmap };
