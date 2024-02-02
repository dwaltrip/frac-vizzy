import { TileCoord } from './types';

function coordStr(coord: TileCoord) {
  return `(${coord.x}, ${coord.y}, ${coord.z})`;
}

export { coordStr };
