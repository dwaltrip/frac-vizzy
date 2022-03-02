import { assert } from './lib/assert';

const TILE_SIDE_LENGTH_IN_PIXELS = 100;

const ZOOM_FACTOR = 4;
assert(ZOOM_FACTOR % 2 === 0, 'ZOOM_FACTOR must be a multiple of 2');


export {
  TILE_SIDE_LENGTH_IN_PIXELS,
};
