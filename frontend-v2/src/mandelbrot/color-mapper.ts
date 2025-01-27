import { Color, ColorMapper, SetStatus, TileData } from '@/mandelbrot/types';

type EscapeTimeColoParams = {
  maxIters: number;
  colors: { start: Color.RGB; end: Color.RGB };
};

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function lerpColor(start: Color.RGB, end: Color.RGB, t: number): Color.RGB {
  return {
    r: Math.round(lerp(start.r, end.r, t)),
    g: Math.round(lerp(start.g, end.g, t)),
    b: Math.round(lerp(start.b, end.b, t)),
  };
}

/**
 * Maps Mandelbrot set points to RGB colors using linear interpolation.
 * Uses end color for points in set, and lerps between start/end colors
 * based on escape time (iters/maxIters) for points outside set.
 */
// function buildColorMapper(tiles: TileData[], params: EscapeTimeColoParams): ColorMapper {
function buildColorMapper(params: EscapeTimeColoParams): ColorMapper {
  return (status: SetStatus) => {
    // Points in the set are always colored with the end color
    if (status.isInSet) {
      // -------------------------------
      // TODO: don't hardcode this here.
      // -------------------------------
      return { r: 0, g: 0, b: 0 };
    }

    // For points outside the set, interpolate based on iteration count
    const t = status.iters / params.maxIters;
    return lerpColor(params.colors.start, params.colors.end, t);
  };
}

function buildHistogramEqualized(
  tiles: TileData[],
  params: EscapeTimeColoParams,
): ColorMapper {
  // Build histogram of iteration counts
  const histogram = new Array(params.maxIters + 1).fill(0);
  tiles.forEach((tile) =>
    tile.forEach((row) =>
      row.forEach((status) => {
        if (!status.isInSet) histogram[status.iters]++;
      }),
    ),
  );

  // Convert to cumulative histogram
  let total = histogram.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  const normalized = histogram.map((count) => {
    cumulative += count;
    return cumulative / total;
  });

  return (status: SetStatus) => {
    if (status.isInSet) return params.colors.end;
    const t = normalized[status.iters];
    return lerpColor(params.colors.start, params.colors.end, t);
  };
}

export { buildColorMapper, buildHistogramEqualized, type EscapeTimeColoParams };
