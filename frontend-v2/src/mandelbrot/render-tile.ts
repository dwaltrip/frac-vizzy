import { perfStats } from '@/lib/perf-stats';

import {
  ComplexNum,
  ComplexRegion,
  FrozenRenderParams,
  Viewport,
  TileResult,
  TileCoord,
} from '@/mandelbrot/types';
import { calcPixelToComplexUnitScale, createZoomInfo } from '@/mandelbrot/zoom';
import { pointsToBitmap } from '@/mandelbrot/utils/points-to-bitmap';

const TILE_ERR_COLOR = '#f0b0b0';

// TODO: DRY up between this and getTilesForParams?
// TODO: REFACTOR THIS!!
async function renderTile(
  tile: TileResult,
  // TODO: use `getTileGridRect`, don't pass this in
  topLeftTileCoord: TileCoord,
  canvas: HTMLCanvasElement,
  params: FrozenRenderParams,
  defaultTileSizePx: number,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  const view = { width: canvas.width, height: canvas.height };
  const region = regionForView(params.center, view, params.zoom);
  const zoomInfo = createZoomInfo(params.zoom, params.defaultTileSizePx);

  const topLeftTileTopLeft = {
    re: topLeftTileCoord.x * zoomInfo.tileSize,
    im: topLeftTileCoord.y * zoomInfo.tileSize,
  };
  const topLeftTileOffset = {
    re: topLeftTileTopLeft.re - region.topLeft.re,
    im: region.topLeft.im - topLeftTileTopLeft.im,
  };
  const topLeftTilePxOffset = {
    x: Math.round(topLeftTileOffset.re / zoomInfo.unitsPerPixel),
    y: Math.round(topLeftTileOffset.im / zoomInfo.unitsPerPixel),
  };

  const coord = tile.params.coord;
  const pxOffset = {
    x:
      topLeftTilePxOffset.x +
      (coord.x - topLeftTileCoord.x) * zoomInfo.tileSizePxScaled,
    y:
      topLeftTilePxOffset.y +
      (topLeftTileCoord.y - coord.y) * zoomInfo.tileSizePxScaled,
  };

  const source = {
    x: 0,
    y: 0,
    width: tile.data[0].length,
    height: tile.data.length,
    // width: defaultTileSizePx,
    // height: defaultTileSizePx,
  };
  if (source.width !== defaultTileSizePx) {
    console.warn('source.width !== defaultTileSizePx', source.width);
  }
  if (source.height !== defaultTileSizePx) {
    console.warn('source.height !== defaultTileSizePx', source.height);
  }

  const dest = {
    x: pxOffset.x,
    y: pxOffset.y,
    width: tileSizeScaled,
    height: tileSizeScaled,
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

  try {
    const points = tile.data;
    const timer1 = perfStats.startTimer('points-to-bitmap');
    const imgBitmap = await pointsToBitmap(points);
    timer1.end();

    const timer2 = perfStats.startTimer('ctx.drawImage');
    ctx.drawImage(
      imgBitmap,
      ...[source.x, source.y, source.width, source.height],
      ...[dest.x, dest.y, dest.width, dest.height],
    );
    timer2.end();
  } catch (error) {
    console.error('Tile render error:', error);
    ctx.fillStyle = TILE_ERR_COLOR;
    ctx.fillRect(...[dest.x, dest.y, dest.width, dest.height]);
  }
}

function regionForView(
  center: ComplexNum,
  view: Viewport,
  zoom: number,
): ComplexRegion {
  const pxToMath = calcPixelToComplexUnitScale(zoom);
  const width = view.width * pxToMath;
  const height = view.height * pxToMath;
  const topLeft = {
    re: center.re - width / 2,
    im: center.im + height / 2,
  };
  return { width, height, topLeft };
}

export { renderTile };
