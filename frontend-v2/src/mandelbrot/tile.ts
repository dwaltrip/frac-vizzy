import {
  TileData,
  TileCoord,
  TileParams,
  ComplexNum,
  PartialTileData,
  PixelCoord,
} from '@/mandelbrot/types';
import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import { createZoomInfo } from '@/mandelbrot/zoom';
import {
  computeRegion,
  computeRegionPointsConditionally,
} from '@/mandelbrot/core';

function makeTileCoord(x: number, y: number, z: number): TileCoord {
  if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)) {
    throw new TypeError('Tile coordinates must be integers');
  }
  return { x, y, z };
}

function topLeftOfTile(coord: TileCoord): ComplexNum {
  const zoomInfo = createZoomInfo(coord.z);
  return {
    re: coord.x * zoomInfo.tileSize,
    im: coord.y * zoomInfo.tileSize,
  };
}

function computeTile({ coord, iters }: TileParams): TileData {
  const zoomInfo = createZoomInfo(coord.z);
  return computeRegion(
    topLeftOfTile(coord),
    { re: zoomInfo.TILE_SIZE_IN_PX, im: zoomInfo.TILE_SIZE_IN_PX },
    zoomInfo.unitsPerPixel,
    iters,
  );
}

function computeTilePointsConditionally(
  { coord, iters }: TileParams,
  shouldComputePoint: (c: ComplexNum, p: PixelCoord) => boolean,
): PartialTileData {
  const zoomInfo = createZoomInfo(coord.z);
  return computeRegionPointsConditionally(
    topLeftOfTile(coord),
    { re: zoomInfo.TILE_SIZE_IN_PX, im: zoomInfo.TILE_SIZE_IN_PX },
    zoomInfo.unitsPerPixel,
    iters,
    shouldComputePoint,
  );
}

type TileGridRect = {
  topLeft: TileCoord;
  botRight: TileCoord;
};

function getTileGridRect(params: FrozenRenderParams): TileGridRect {
  const zoomInfo = createZoomInfo(params.zoom);
  const view = params.view;
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
): TileParams[] {
  const grid = getTileGridRect(params);
  const truncZoom = Math.floor(params.zoom);
  const tiles = [];
  for (let x = grid.topLeft.x; x <= grid.botRight.x; x++) {
    for (let y = grid.topLeft.y; y >= grid.botRight.y; y--) {
      tiles.push({
        coord: makeTileCoord(x, y, truncZoom),
        iters: params.iters,
      });
    }
  }
  return tiles;
}

export {
  computeTile,
  computeTilePointsConditionally,
  getTileGridRect,
  calculateVisibleTilesUsingUpscaling,
};
