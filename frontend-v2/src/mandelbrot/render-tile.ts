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
  topLeftTileCoord: TileCoord,
  canvas: HTMLCanvasElement,
  params: FrozenRenderParams,
  defaultTileSizePx: number,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  const view = { width: canvas.width, height: canvas.height };
  const region = regionForView(params.center, view, params.zoom);

  const zoom = params.zoom;
  const scaleAmount = Math.pow(2, zoom - Math.floor(zoom));
  const rawRenderedTileSizePx = defaultTileSizePx * scaleAmount;
  // We can (and MUST) use Math.round here as rawRenderedTileSizePx
  // should be incredibly close to an integer already.
  // In CanvasManger, we only call renderMandelbrot when we hit the next
  //   increment of tile sizes of integer dimensions.
  // Due to floating point rounding issues, Math.floor won't work here.
  // Refactor to make this more obvious / skip converting back and forth
  //   between zoom levels and tile sizes extra times?
  const renderedTileSizePx = Math.round(rawRenderedTileSizePx);
  const zoomInfo = createZoomInfo(params);

  const topLeftTileTopLeft = {
    re: topLeftTileCoord.x * zoomInfo.tileSize,
    im: topLeftTileCoord.y * zoomInfo.tileSize,
  };
  const topLeftTileOffset = {
    re: topLeftTileTopLeft.re - region.topLeft.re,
    im: region.topLeft.im - topLeftTileTopLeft.im,
  };
  const topLeftTilePxOffset = {
    x: Math.round(topLeftTileOffset.re / zoomInfo.pxToMath),
    y: Math.round(topLeftTileOffset.im / zoomInfo.pxToMath),
  };

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const tileCoord = tile.params.coord;
  const pxOffset = {
    x:
      topLeftTilePxOffset.x +
      (tileCoord.x - topLeftTileCoord.x) * zoomInfo.tileSizePx,
    y:
      topLeftTilePxOffset.y +
      (topLeftTileCoord.y - tileCoord.y) * zoomInfo.tileSizePx,
  };

  const source = {
    x: 0,
    y: 0,
    width: defaultTileSizePx,
    height: defaultTileSizePx,
  };
  const dest = {
    x: pxOffset.x,
    y: pxOffset.y,
    width: renderedTileSizePx,
    height: renderedTileSizePx,
  };

  // TODO: I'm not sure if these `Math.round` calls are needed.
  // I did it for perf (to render only at integer pixels on the canvas).
  // But it'd be nice to verify that it actually matters.
  if (pxOffset.x < 0) {
    source.x = -1 * Math.round(pxOffset.x / scaleAmount);
    source.width += Math.round(pxOffset.x / scaleAmount);
    dest.x = 0;
    dest.width += pxOffset.x;
  }
  if (pxOffset.y < 0) {
    source.y = -1 * Math.round(pxOffset.y / scaleAmount);
    source.height += Math.round(pxOffset.y / scaleAmount);
    dest.y = 0;
    dest.height += pxOffset.y;
  }

  try {
    const points = tile.data;
    const imgBitmap = await pointsToBitmap(points);

    const timer = perfStats.startTimer('ctx.drawImage');
    ctx.drawImage(
      imgBitmap,
      ...[source.x, source.y, source.width, source.height],
      ...[dest.x, dest.y, dest.width, dest.height],
    );
    timer.end();
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
