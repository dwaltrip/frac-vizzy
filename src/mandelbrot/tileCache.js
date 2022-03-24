import { assert } from '../lib/assert';

// TODO: make sure it doesn't get too big....?
const tileCache = {
  _cache: {

  },
  _keysByOrderAdded: [],

  hasTile(tileId) {
    const key = keyForTile(tileId);
    return key in this._cache;
  },

  // TODO: This is where we would update the "last accessed" info for this tile
  getTile(tileId) {
    const key = keyForTile(tileId);
    assert(this.hasTile(tileId), `Tile ${key} is not in cache`);
    return this._cache[key];
  },

  addTile(tileId, points) {
    const key = keyForTile(tileId);
    this._cache[key] = { tileId, points };
    this._keysByOrderAdded.push(key);
  }
};

function keyForTile(tileId) {
  const {
    gridCoord: { x, y },
    zoomLevel,
    cacheParams: { iterationLimit },
  } = tileId;
  return `(x=${x},y=${y},z=${zoomLevel},iterLimit=${iterationLimit})`;
}

export { tileCache };
