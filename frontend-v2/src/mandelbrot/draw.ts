import { RegionData, ColorMapper } from '@/mandelbrot/types';

function drawPoints(
  imageData: ImageData,
  points: RegionData,
  getColor: ColorMapper,
) {
  const height = points.length;
  const width = points[0].length;

  if (imageData.height !== height || imageData.width !== width) {
    throw new Error('Image dims must match region dims');
  }

  for (let y = 0; y < height; y++) {
    const row = points[y];
    for (let x = 0; x < width; x++) {
      const status = row[x];
      const color = getColor(status);

      const index = (x + y * imageData.width) * 4;
      imageData.data[index + 0] = color.r;
      imageData.data[index + 1] = color.g;
      imageData.data[index + 2] = color.b;
      imageData.data[index + 3] = 255;
    }
  }
}

export { drawPoints };
