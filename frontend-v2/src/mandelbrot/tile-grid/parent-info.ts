import { TileCoord, ParentInfo, TileCorner } from '@/mandelbrot/types';

function getParentTileInfo(child: TileCoord): ParentInfo {
  const parent = {
    z: child.z - 1,
    x: Math.floor(child.x / 2),
    y: Math.floor(child.y / 2),
  };

  const isTop = child.y % 2 === 1;
  const isRight = child.x % 2 === 1;

  const corner: TileCorner = isTop
    ? isRight
      ? 'topRight'
      : 'topLeft'
    : isRight
    ? 'botRight'
    : 'botLeft';
  return { parent, child, corner };
}

type Range = { start: number; end: number };

function getCornerSliceIndices(
  corner: TileCorner,
  parentSizePx: number,
): { x: Range; y: Range } {
  const range = (start: number, end: number) => ({ start, end });

  const size = parentSizePx / 2;
  const slices = {
    topLeft: {
      x: range(0, size),
      y: range(0, size),
    },
    topRight: {
      x: range(size, parentSizePx),
      y: range(0, size),
    },
    botLeft: {
      x: range(0, size),
      y: range(size, parentSizePx),
    },
    botRight: {
      x: range(size, parentSizePx),
      y: range(size, parentSizePx),
    },
  };
  return slices[corner];
}

export { getParentTileInfo, getCornerSliceIndices };
