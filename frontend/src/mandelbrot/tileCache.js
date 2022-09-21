import { TILE_SIDE_LENGTH_IN_PIXELS } from '../settings';
import { LRUCache } from '../lib/LRUCache';

// TODO: Need to do more research to determine a good limit.
// This is a conservative estimate for now.
// ---------------------------------------------------------
// According to the `object-sizeof` package, each pixel (an array of one bool
//   and one number) uses 12 bytes. Not sure how accurate this package is.
// Let's just assume, conservatively, is pixel is 20 bytes for now...
const PIXEL_SIZE = 20; // bytes
const PIXELS_PER_TILE = Math.pow(TILE_SIDE_LENGTH_IN_PIXELS, 2);
// NOTE: I did a very quick n dirty test in a chrome tab, and the JS heap size
// seemed to stabilize around 950 MB. It makes sense that it would be bigger
// than 500 MB, but I think I might have expected it to be not that high.
const MAX_MEMORY_USAGE = 500 * (1024 * 1000); // 500 MB
const MAX_TILE_CACHE_SIZE = MAX_MEMORY_USAGE / (20 * PIXELS_PER_TILE);

const tileCache = new LRUCache({
  getKey: (item) => {
    // allow for passing both `getKey(tileId)` and `getKey({ tileId })`
    const tileId = item.tileId || item;
    const {
      gridCoord: { x, y },
      zoomLevel,
      cacheParams: { iterationLimit },
    } = tileId;
    return `(x=${x},y=${y},z=${zoomLevel},iterLimit=${iterationLimit})`;
  },
  maxSize: MAX_TILE_CACHE_SIZE,
});

export { tileCache, MAX_TILE_CACHE_SIZE };
