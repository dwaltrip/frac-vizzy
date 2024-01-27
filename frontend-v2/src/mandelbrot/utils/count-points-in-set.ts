import { RegionData } from '@/mandelbrot/types';

function countPointsInSet(points: RegionData) {
  return points.reduce((acc, row) => acc + sumIf(row, (p) => p.isInSet), 0);
}

function sumIf<T>(arr: T[], predicate: (t: T) => boolean): number {
  return arr.reduce((acc, t) => (predicate(t) ? acc + 1 : acc), 0);
}

export { countPointsInSet };
