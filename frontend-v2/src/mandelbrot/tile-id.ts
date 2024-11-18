import { TileID, TileParams } from '@/mandelbrot/types';

// TODO: rename makeTileId?
function getTileId(tile: TileParams): TileID {
  const {
    coord: { x, y, z },
    iters,
  } = tile;
  return `(x=${x},y=${y},z=${z},iters=${iters})`;
}

export { getTileId };
