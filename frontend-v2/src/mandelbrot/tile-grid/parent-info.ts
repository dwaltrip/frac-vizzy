import { TileCoord, ParentInfo, TileCorner } from '@/mandelbrot/types';

function getParentTileInfo(child: TileCoord): ParentInfo {
  const parent = {
    // Parent is one zoom level up
    z: child.z - 1,
    // For x (left edge), simple floor division works
    x: Math.floor(child.x / 2),
    // For y (top edge), we need to offset by -1 before division and +1 after,
    // due to tiles getting their coordinates from the top-left corner
    y: Math.floor((child.y - 1) / 2) + 1,
  };

  // Child base coordinates (top-left of bottom-left child)
  // Adjusted for y-coord convention
  const baseChild = { x: parent.x * 2, y: parent.y * 2 - 1, z: child.z };

  // Determine which corner
  const isRightSide = child.x > baseChild.x;
  const isTopSide = child.y > baseChild.y;

  const corner: TileCorner = isTopSide
    ? isRightSide
      ? 'topRight'
      : 'topLeft'
    : isRightSide
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

interface ChildTiles {
  topLeft: TileCoord;
  topRight: TileCoord;
  botLeft: TileCoord;
  botRight: TileCoord;
}

function getChildTiles(parent: TileCoord): ChildTiles {
  const childZ = parent.z + 1;
  // Adjusted for y-coord convention
  const base = { x: parent.x * 2, y: parent.y * 2 - 1 };

  return {
    topLeft: { x: base.x, y: base.y + 1, z: childZ },
    topRight: { x: base.x + 1, y: base.y + 1, z: childZ },
    botLeft: { x: base.x, y: base.y, z: childZ },
    botRight: { x: base.x + 1, y: base.y, z: childZ },
  };
}

export { getParentTileInfo, getCornerSliceIndices, getChildTiles };
