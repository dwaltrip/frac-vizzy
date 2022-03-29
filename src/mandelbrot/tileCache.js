import { assert } from '../lib/assert';
import { DoublyLinkedList } from '../lib/doublyLinkedList';

import { TILE_SIDE_LENGTH_IN_PIXELS } from '../settings';

// TODO: Need to do more research to determine a good limit.
// This is a conservative estimate for now.
// ---------------------------------------------------------
// According to the `object-sizeof` package, each pixel (an array of one bool
//   and one number) uses 12 bytes. Not sure how accurate this package is.
// Let's just assume, conservatively, is pixel is 20 bytes for now...
const PIXEL_SIZE = 20; // bytes
const PIXELS_PER_TILE = Math.pow(TILE_SIDE_LENGTH_IN_PIXELS, 2);
const MAX_MEMORY_USAGE = 500 * (1024 * 1000); // 500 MB
const MAX_TILE_CACHE_SIZE = MAX_MEMORY_USAGE / (20 * PIXELS_PER_TILE);

const tileCache = {
  _cache: {},
  _LRULinkedList: new DoublyLinkedList(),
  _keyToNodeMap: {},

  hasTile(tileId) {
    const key = keyForTile(tileId);
    return key in this._cache;
  },

  getTile(tileId) {
    const key = keyForTile(tileId);
    assert(this.hasTile(tileId), `Tile ${key} is not in cache`);
    // This tile is now the most recently accessed
    this._LRULinkedList.moveNodeToHead(this._keyToNodeMap[key]);
    return this._cache[key];
  },

  addTile(tileId, points) {
    if (this._LRULinkedList.length >= MAX_TILE_CACHE_SIZE) {
      // TODO: check how performant this evicition is.
      // I think, in theory, it should be quick... We are just
      // adjusting a few pointers per node that is removed.
      // Although it may trigger GC?
      // Most of the time we are bulk evicting the last N items.
      // If this a bottleneck, we could probably improve that.
      const node = this._LRULinkedList.removeTail();
      const keyToRemove = node.data;
      delete this._cache[keyToRemove];
      delete this._keyToNodeMap[keyToRemove];
    }
    const key = keyForTile(tileId);
    this._keyToNodeMap[key] = this._LRULinkedList.insertAtHead(key);
    this._cache[key] = { tileId, points };
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
