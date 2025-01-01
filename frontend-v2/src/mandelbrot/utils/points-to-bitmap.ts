// TODO: Move to common type file / folder?
import { ColorMapper, SetStatus } from '@/mandelbrot/types';
import { drawPoints } from '@/mandelbrot/draw';
import { perfStats } from '@/lib/perf-stats';

function pointsToBitmap(
  points: SetStatus[][],
  getColor: ColorMapper,
): Promise<ImageBitmap> {
  const timer = perfStats.startTimer('pointsToBitmap');
  const width = points[0].length;
  const height = points.length;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  const imageData = ctx.createImageData(width, height);
  drawPoints(imageData, points, getColor);
  ctx.putImageData(imageData, 0, 0);

  return timer.endWithResult(createImageBitmap(canvas));
  // return createImageBitmap(canvas);
}

export { pointsToBitmap };
