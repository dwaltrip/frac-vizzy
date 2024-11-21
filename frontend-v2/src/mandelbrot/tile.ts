import { TileData, TileCoord, TileParams } from '@/mandelbrot/types';
import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import { createZoomInfo } from '@/mandelbrot/zoom';
import { computeRegion } from '@/mandelbrot/core';

// TODO: dedupe with `getTileId` in `tile-id.ts`
function makeTileCoord(x: number, y: number, z: number): TileCoord {
  if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)) {
    throw new TypeError('Tile coordinates must be integers');
  }
  return { x, y, z };
}

function computeTile({ coord, iters }: TileParams): TileData {
  const zoomInfo = createZoomInfo(coord.z);
  return computeRegion(
    // TODO: tile should know its own top left? or make this a function?
    {
      re: coord.x * zoomInfo.tileSize,
      im: coord.y * zoomInfo.tileSize,
    },
    { re: zoomInfo.TILE_SIZE_IN_PX, im: zoomInfo.TILE_SIZE_IN_PX },
    zoomInfo.unitsPerPixel,
    iters,
  );
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
  const zoomInfo = createZoomInfo(params.zoom);
  const region = {
    width: view.width * zoomInfo.unitsPerPixel,
    height: view.height * zoomInfo.unitsPerPixel,
  };

  const c = params.center;
  const startTileX = Math.floor((c.re - region.width / 2) / zoomInfo.tileSize);
  const endTileX = Math.ceil((c.re + region.width / 2) / zoomInfo.tileSize);

  const startTileY = Math.ceil((c.im + region.height / 2) / zoomInfo.tileSize);
  const endTileY = Math.floor((c.im - region.height / 2) / zoomInfo.tileSize);

  return {
    topLeft: makeTileCoord(startTileX, startTileY, zoomInfo.integerPartOfZoom),
    botRight: makeTileCoord(endTileX, endTileY, zoomInfo.integerPartOfZoom),
  };
}

function calculateVisibleTilesUsingUpscaling(
  params: FrozenRenderParams,
  view: { width: number; height: number },
) {
  const grid = getTileGridRect(params, view);
  const truncZoom = Math.floor(params.zoom);
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
  // calculateVisibleTiles,
  getTileGridRect,
  calculateVisibleTilesUsingUpscaling,
};
