import { SetStatus } from '@/mandelbrot/core.ts';

function drawPoints(imageData: ImageData, points: SetStatus[][]): void {
  const height = points.length;
  const width = points[0].length;

  if (imageData.height !== height || imageData.width !== width) {
    throw new Error('Image data must match tile size');
  }

  for (let y = 0; y < height; y++) {
    const row = points[y];
    for (let x = 0; x < width; x++) {
      const pointStatus = row[x];
      const color = pointStatus.isInSet
        ? { r: 0, g: 0, b: 0 }
        : { r: 255, g: 240, b: 240 };

      const index = (x + y * imageData.width) * 4;
      imageData.data[index + 0] = color.r;
      imageData.data[index + 1] = color.g;
      imageData.data[index + 2] = color.b;
      imageData.data[index + 3] = 255;
    }
  }
}

export { drawPoints };
