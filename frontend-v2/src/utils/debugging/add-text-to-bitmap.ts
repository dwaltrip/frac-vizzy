interface TextStyleOptions {
  fontSize?: number;
  fillStyle?: string;
  padding?: number;
}

async function addTextToBitmap(
  bitmap: ImageBitmap,
  text: string,
  { fontSize = 10, fillStyle = 'red', padding = 5 }: TextStyleOptions = {},
): Promise<ImageBitmap> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  ctx.drawImage(bitmap, 0, 0);

  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = fillStyle;
  ctx.textBaseline = 'top';
  ctx.fillText(text, padding, padding);

  return createImageBitmap(canvas);
}

export { addTextToBitmap };
