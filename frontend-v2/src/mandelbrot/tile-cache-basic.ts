import { TileCoord } from '@/mandelbrot/types';

const tileCache = new Map();

function setTileInCache(tile: TileCoord, img: ImageBitmap) {
  tileCache.set(_getKey(tile), img);
}

function getTileFromCache(tile: TileCoord): ImageBitmap {
  return tileCache.get(_getKey(tile));
}

function isInCache(tile: TileCoord): boolean {
  return tileCache.has(_getKey(tile));
}

function _getKey(tile: TileCoord): string {
  return `${tile.x}-${tile.y}-${tile.z}`;
}

export { setTileInCache, getTileFromCache, isInCache };
