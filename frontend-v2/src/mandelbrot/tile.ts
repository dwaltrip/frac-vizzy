import { perfStats } from '@/lib/perf-stats';
import {
  TILE_SIZE_IN_PX,
  calcPixelToComplexUnitScale,
  tileSizeInComplexUnits,
} from '@/mandelbrot/zoom';
import { computeRegion } from '@/mandelbrot/core';
import { ComplexNum, SetStatus, TileCoord, ZoomInfo } from '@/mandelbrot/types';

function makeTileCoord(x: number, y: number, z: number): TileCoord {
  if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)) {
    throw new TypeError('Tile coordinates must be integers');
  }
  return { x, y, z };
}

function computeTile(coords: TileCoord): SetStatus[][] {
  const timer = perfStats.startTimer('computeTile');
  const zoom = coords.z;
  const tileSize = tileSizeInComplexUnits(zoom);
  const pxToMath = calcPixelToComplexUnitScale(zoom);

  // return computeRegion(
  const result = computeRegion(
    // TODO: tile should know its own top left? or make this a function?
    { re: coords.x * tileSize, im: coords.y * tileSize },
    { re: TILE_SIZE_IN_PX, im: TILE_SIZE_IN_PX },
    pxToMath,
    100,
  );
  return timer.endWithResult(result);
}

// TODO: we aren't getting tiles that partially overlap the view on top and left edges.
function calculateVisibleTiles(
  zoom: number,
  center: ComplexNum,
  tileSizePx: number,
  view: { width: number; height: number },
) {
  const pxToMath = calcPixelToComplexUnitScale(zoom);
  const region = {
    width: view.width * pxToMath,
    height: view.height * pxToMath,
  };

  const tileSize = tileSizePx * pxToMath;
  const c = center;
  const startTileX = Math.floor((c.re - region.width / 2) / tileSize);
  const endTileX = Math.ceil((c.re + region.width / 2) / tileSize);
  const startTileY = Math.floor((c.im - region.height / 2) / tileSize);
  const endTileY = Math.ceil((c.im + region.height / 2) / tileSize);

  const tiles = [];
  for (let x = startTileX; x <= endTileX; x++) {
    for (let y = endTileY; y >= startTileY; y--) {
      tiles.push(makeTileCoord(x, y, zoom));
    }
  }
  return tiles;
}

function calculateVisibleTilesUsingUpscaling(
  zoomInfo: ZoomInfo,
  center: ComplexNum,
  view: { width: number; height: number },
) {
  const truncZoom = Math.floor(zoomInfo.value);
  const region = {
    width: view.width * zoomInfo.pxToMath,
    height: view.height * zoomInfo.pxToMath,
  };

  const tileSize = zoomInfo.tileSize;
  const c = center;
  const startTileX = Math.floor((c.re - region.width / 2) / tileSize);
  const endTileX = Math.ceil((c.re + region.width / 2) / tileSize);

  const startTile = Math.ceil((c.im + region.height / 2) / tileSize);
  const endTile = Math.floor((c.im - region.height / 2) / tileSize);

  const tiles = [];
  for (let x = startTileX; x <= endTileX; x++) {
    for (let y = startTile; y >= endTile; y--) {
      tiles.push(makeTileCoord(x, y, truncZoom));
    }
  }
  return tiles;
}

export {
  computeTile,
  calculateVisibleTiles,
  calculateVisibleTilesUsingUpscaling,
};
