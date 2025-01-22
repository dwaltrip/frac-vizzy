import {
  ColorMapper,
  TileData,
  PartialTileData,
  SetStatus,
} from '@/mandelbrot/types';
import { EscapeTimeColoParams } from '@/mandelbrot/color-mapper';

interface Histogram {
  numPoints: number;
  data: Map<number, number>;
}

function buildGetColorUsingHistogram(
  tiles: (TileData | PartialTileData)[],
  colorParams: EscapeTimeColoParams,
): ColorMapper {
  const histogram = buildHistogram(tiles);
  const { numPoints: totalPoints, data } = histogram;

  const sortedKeys = Array.from(data.keys()).sort((a, b) => a - b);
  const {
    colors: { start, end },
    maxIters,
  } = colorParams;
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

  // Fill in any gaps in the color map
  let currColor = colorMap.get(sortedKeys[0])!;
  for (let n = 0; n <= maxIters; n++) {
    if (colorMap.has(n)) {
      currColor = colorMap.get(n);
    } else {
      colorMap.set(n, currColor);
    }
  }

  return function getColor(status: SetStatus) {
    if (status.isInSet) {
      // return { r: 0, g: 0, b: 0 };
      return start;
    }
    return colorMap.get(status.iters);
  };
}

function buildHistogram(tiles: (TileData | PartialTileData)[]): Histogram {
  const data = new Map<number, number>();
  let numPoints = 0;

  function increment(val: number) {
    if (!data.has(val)) {
      data.set(val, 0);
    }
    data.set(val, data.get(val)! + 1);
  }

  for (const tile of tiles) {
    tile.forEach((row) => {
      row.forEach((status) => {
        if (status) {
          increment(status.iters);
          numPoints += 1;
        }
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
