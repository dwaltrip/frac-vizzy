import { perfStats } from '@/lib/perf-stats';

import {
  ComplexNum,
  FrozenRenderParams,
  TileData,
  TileCoord,
  TileParams,
} from '@/mandelbrot/types';
import {
  TILE_SIZE_IN_PX,
  createZoomInfo,
  calcPixelToComplexUnitScale,
  tileSizeInComplexUnits,
} from '@/mandelbrot/zoom';
import { computeRegion } from '@/mandelbrot/core';

function makeTileCoord(x: number, y: number, z: number): TileCoord {
  if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)) {
    throw new TypeError('Tile coordinates must be integers');
  }
  return { x, y, z };
}

function computeTile({ coord, iters }: TileParams): TileData {
  const timer = perfStats.startTimer('computeTile');
  const zoom = coord.z;
  const tileSize = tileSizeInComplexUnits(zoom);
  const pxToMath = calcPixelToComplexUnitScale(zoom);

  // return computeRegion(
  const result = computeRegion(
    // TODO: tile should know its own top left? or make this a function?
    { re: coord.x * tileSize, im: coord.y * tileSize },
    { re: TILE_SIZE_IN_PX, im: TILE_SIZE_IN_PX },
    pxToMath,
    iters,
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

type TileGridRect = {
  topLeft: TileCoord;
  botRight: TileCoord;
};

// --------------------
// WITH UPSCALING!!!!!!
// --------------------
function getTileGridRect(
  params: FrozenRenderParams,
  view: { width: number; height: number },
): TileGridRect {
  const zoomInfo = createZoomInfo(params);
  const truncZoom = Math.floor(zoomInfo.value);
  const region = {
    width: view.width * zoomInfo.pxToMath,
    height: view.height * zoomInfo.pxToMath,
  };

  const tileSize = zoomInfo.tileSize;
  const c = params.center;
  const startTileX = Math.floor((c.re - region.width / 2) / tileSize);
  const endTileX = Math.ceil((c.re + region.width / 2) / tileSize);

  const startTileY = Math.ceil((c.im + region.height / 2) / tileSize);
  const endTileY = Math.floor((c.im - region.height / 2) / tileSize);

  return {
    topLeft: makeTileCoord(startTileX, startTileY, truncZoom),
    botRight: makeTileCoord(endTileX, endTileY, truncZoom),
  };
}

function calculateVisibleTilesUsingUpscaling(
  params: FrozenRenderParams,
  view: { width: number; height: number },
) {
  const grid = getTileGridRect(params, view);
  // const zoomInfo = createZoomInfo(params);
  const truncZoom = Math.floor(params.zoom);
  // const truncZoom = Math.floor(params.zoom);

  const tiles = [];
  for (let x = grid.topLeft.x; x <= grid.botRight.x; x++) {
    for (let y = grid.topLeft.y; y >= grid.botRight.y; y--) {
      tiles.push(makeTileCoord(x, y, truncZoom));
    }
  }
  return tiles;
}

export {
  computeTile,
  calculateVisibleTiles,
  getTileGridRect,
  calculateVisibleTilesUsingUpscaling,
};