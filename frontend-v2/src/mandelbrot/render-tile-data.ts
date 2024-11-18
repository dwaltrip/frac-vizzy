// import { getTileGridRect } from "@/mandelbrot/tile";
import {
  ComplexNum,
  ComplexRegion,
  FrozenRenderParams,
  RegionData,
  TileCoord,
  TileResult,
  Viewport,
} from '@/mandelbrot/types';
import { pointsToBitmap } from '@/mandelbrot/utils/points-to-bitmap';
import {
  calcUnitsPerPixel,
  TILE_SIZE_IN_PX,
  tileSizeInComplexUnits,
  tileSizeScaledForFractionalZoom,
} from '@/mandelbrot/zoom';
import { getTileGridRect } from '@/mandelbrot/tile';

interface ImageSpec {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function renderTile(
  tile: TileResult,
  canvas: HTMLCanvasElement,
  params: FrozenRenderParams,
) {
  const view = { width: canvas.width, height: canvas.height };
  const region = regionForView(params.center, view, params.zoom);
  const topLeftTileCoord = getTileGridRect(params, view).topLeft;

  const tileSize = tileSizeInComplexUnits(params.zoom);
  const tileSizePx = tileSizeScaledForFractionalZoom(
    params.zoom,
    TILE_SIZE_IN_PX,
  );
  const unitsPerPixel = calcUnitsPerPixel(params.zoom);

  const topLeftTileTopLeft = {
    re: topLeftTileCoord.x * tileSize,
    im: topLeftTileCoord.y * tileSize,
  };
  const topLeftTileOffset = {
    re: topLeftTileTopLeft.re - region.topLeft.re,
    im: region.topLeft.im - topLeftTileTopLeft.im,
  };
  const topLeftTileCanvasCoords = {
    x: Math.round(topLeftTileOffset.re / unitsPerPixel),
    y: Math.round(topLeftTileOffset.im / unitsPerPixel),
  };

  const coord = tile.params.coord;
  const canvasCoords = {
    x: topLeftTileCanvasCoords.x + (coord.x - topLeftTileCoord.x) * tileSizePx,
    y: topLeftTileCanvasCoords.y + (topLeftTileCoord.y - coord.y) * tileSizePx,
  };

  const source = {
    x: 0,
    y: 0,
    width: tile.data[0].length,
    height: tile.data.length,
  };

  const dest = {
    x: canvasCoords.x,
    y: canvasCoords.y,
    width: zoomInfo.renderedTileSizePx,
    height: zoomInfo.renderedTileSizePx,
  };

  // TODO: I'm not sure if these `Math.round` calls are needed.
  // I did it for perf (to render only at integer pixels on the canvas).
  // But it'd be nice to verify that it actually matters.
  if (pxOffset.x < 0) {
    source.x = -1 * Math.round(pxOffset.x / zoomInfo.tileScaleFactor);
    source.width += Math.round(pxOffset.x / zoomInfo.tileScaleFactor);
    dest.x = 0;
    dest.width += pxOffset.x;
  }
  if (pxOffset.y < 0) {
    source.y = -1 * Math.round(pxOffset.y / zoomInfo.tileScaleFactor);
    source.height += Math.round(pxOffset.y / zoomInfo.tileScaleFactor);
    dest.y = 0;
    dest.height += pxOffset.y;
  }

  await renderRegionData(
    canvas,
    data,
    source,
    dest,
    unscaledTileSizePx,
    params,
  );
}

async function renderRegionData(
  canvas: HTMLCanvasElement,
  data: RegionData,
  source: ImageSpec,
  dest: ImageSpec,
  params: FrozenRenderParams,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  // const canvasCoords = {
  //   x:
  //     topLeftTilePxOffset.x +
  //     (coord.x - topLeftTileCoord.x) * tileSizePx,
  //   y:
  //     topLeftTilePxOffset.y +
  //     (topLeftTileCoord.y - coord.y) * tileSizePx,
  // };

  try {
    const imgBitmap = await pointsToBitmap(data);

    ctx.drawImage(
      imgBitmap,
      ...[source.x, source.y, source.width, source.height],
      ...[dest.x, dest.y, dest.width, dest.height],
    );
  } catch (error) {
    console.error('Tile render error:', error);
  }
}

function regionForView(
  center: ComplexNum,
  view: Viewport,
  zoom: number,
): ComplexRegion {
  const unitsPerPixel = calcUnitsPerPixel(zoom);
  const width = view.width * unitsPerPixel;
  const height = view.height * unitsPerPixel;
  const topLeft = {
    re: center.re - width / 2,
    im: center.im + height / 2,
  };
  return { width, height, topLeft };
}
