import {
  ComplexNum,
  ComplexRegion,
  // FrozenRenderParams,
  TileResult,
  Viewport,
} from '@/mandelbrot/types';

import { pointsToBitmap } from '@/mandelbrot/utils/points-to-bitmap';
import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import { calcUnitsPerPixel, createZoomInfo } from '@/mandelbrot/zoom';
import { getTileGridRect } from '@/mandelbrot/tile';

async function renderTile(
  canvas: HTMLCanvasElement,
  tile: TileResult,
  params: FrozenRenderParams,
) {
  // TODO: The view dimensions are stored on the render params now,
  //   so we don't need to read from the canvas.
  //   Can probably just pass `params` to `regionForView`.
  const view = { width: canvas.width, height: canvas.height };
  const region = regionForView(params.center, view, params.zoom);
  const grid = getTileGridRect(params, view);
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

  const coord = tile.params.coord;
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
    width: tile.data[0].length,
    height: tile.data.length,
  };

  const dest = {
    x: canvasCoords.x,
    y: canvasCoords.y,
    width: zoomInfo.tileSizePxScaled,
    height: zoomInfo.tileSizePxScaled,
  };

  // TODO: I'm not sure if these `Math.round` calls are needed.
  // I did it for perf (to render only at integer pixels on the canvas).
  // But it'd be nice to verify that it actually matters.
  if (canvasCoords.x < 0) {
    source.x = -1 * Math.round(canvasCoords.x / zoomInfo.scaleFactor);
    source.width += Math.round(canvasCoords.x / zoomInfo.scaleFactor);
    dest.x = 0;
    dest.width += canvasCoords.x;
  }
  if (canvasCoords.y < 0) {
    source.y = -1 * Math.round(canvasCoords.y / zoomInfo.scaleFactor);
    source.height += Math.round(canvasCoords.y / zoomInfo.scaleFactor);
    dest.y = 0;
    dest.height += canvasCoords.y;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  try {
    const imgBitmap = await pointsToBitmap(tile.data);
    // NOTE: Using `addTextToBitmap` is great for getting a live "debug" view of tile-level stuff
    // const debugInfo = `${coord.x}, ${coord.y}, ${coord.zoom} (${someDebugData})`;
    // let imgBitmap = await pointsToBitmap(tile.data, getColor);
    // imgBitmap = await addTextToBitmap(imgBitmap, debugInfo, {
    //   fontSize: 8,
    //   padding: 2,
    // });

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

export { renderTile };
