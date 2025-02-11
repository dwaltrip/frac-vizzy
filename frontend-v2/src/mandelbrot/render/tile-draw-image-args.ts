import { TileParams } from '@/mandelbrot/types';
import { regionForParams } from '@/mandelbrot/core/region-for-params';

import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import { getTileGridRect } from '@/mandelbrot/tile';
import { createZoomInfo } from '@/mandelbrot/zoom';

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface TileDrawImageArgs {
  source: Rect;
  dest: Rect;
}

function getTileDrawImageArgs(
  tile: TileParams,
  params: FrozenRenderParams,
  tileDataDims?: { width: number; height: number },
): TileDrawImageArgs {
  if (!tileDataDims) {
    tileDataDims = {
      width: params.baseTileSizePx,
      height: params.baseTileSizePx,
    };
  }

  const region = regionForParams(params);
  const grid = getTileGridRect(params);
  const topLeftTileCoord = grid.topLeft;
  const zoomInfo = createZoomInfo(params.zoom);

  const topLeftTileTopLeft = {
    re: topLeftTileCoord.x * zoomInfo.tileSize,
    im: topLeftTileCoord.y * zoomInfo.tileSize,
  };
  const topLeftTileOffset = {
    re: topLeftTileTopLeft.re - region.topLeft.re,
    im: region.topLeft.im - topLeftTileTopLeft.im,
  };
  const topLeftTileCanvasCoords = {
    x: Math.round(topLeftTileOffset.re / zoomInfo.unitsPerPixel),
    y: Math.round(topLeftTileOffset.im / zoomInfo.unitsPerPixel),
  };

  const coord = tile.coord;
  const canvasCoords = {
    x:
      topLeftTileCanvasCoords.x +
      (coord.x - topLeftTileCoord.x) * zoomInfo.tileSizePxScaled,
    y:
      topLeftTileCanvasCoords.y +
      (topLeftTileCoord.y - coord.y) * zoomInfo.tileSizePxScaled,
  };

  const source = {
    x: 0,
    y: 0,
    width: tileDataDims.width,
    height: tileDataDims.height,
  };
  // dest.x and dest.y may may be negative for tiles partially offscreen,
  // but it's fine, as ctx.drawImage will clip the bitmaps.
  const dest = {
    x: canvasCoords.x,
    y: canvasCoords.y,
    width: zoomInfo.tileSizePxScaled,
    height: zoomInfo.tileSizePxScaled,
  };
  return { source, dest };
}

export { getTileDrawImageArgs };
