import { ColorMapper, TileData } from '@/mandelbrot/types';
import { EscapeTimeColoParams } from '@/mandelbrot/color-mapper';

interface Histogram {
  numPoints: number;
  data: Map<number, number>;
}

function buildGetColorUsingHistogram(
  tiles: TileData[],
  colorParams: EscapeTimeColoParams,
): ColorMapper {
  const histogram = buildHistogram(tiles);

  const { numPoints: totalPoints, data } = histogram;
  const sortedKeys = Array.from(data.keys()).sort((a, b) => a - b);

  let { start, end } = colorParams.colors;

  const colorMap = new Map();

  let cumulativePointsSeen = 0;
  sortedKeys.forEach((iteration) => {
    cumulativePointsSeen += data.get(iteration)!;
    const percent = cumulativePointsSeen / totalPoints;

    const r = percentToRangeVal(percent, start.r, end.r);
    const g = percentToRangeVal(percent, start.g, end.g);
    const b = percentToRangeVal(percent, start.b, end.b);
    colorMap.set(iteration, { r, g, b });
  });

  return function getColor(status) {
    if (status.isInSet) {
      return { r: 0, g: 0, b: 0 };
    }
    return colorMap.get(status.iters);
  };
}

function buildHistogram(tiles: TileData[]): Histogram {
  const data = new Map();
  let numPoints = 0;

  function increment(val: number) {
    if (!data.has(val)) {
      data.set(val, 0);
    }
    data.set(val, data.get(val) + 1);
  }

  for (const tile of tiles) {
    tile.forEach((row) => {
      row.forEach((status) => {
        increment(status.iters);
        numPoints += 1;
      });
    });
  }

  return { numPoints, data };
}

function percentToRangeVal(
  percent: number,
  start: number,
  end: number,
): number {
  return Math.floor(start + percent * (end - start));
}

export { buildGetColorUsingHistogram };
