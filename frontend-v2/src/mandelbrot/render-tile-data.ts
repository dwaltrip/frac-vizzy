// import { getTileGridRect } from "@/mandelbrot/tile";
import {
  ComplexNum,
  ComplexRegion,
  // FrozenRenderParams,
  RegionData,
  TileCoord,
  // TileCoord,
  TileResult,
  Viewport,
} from '@/mandelbrot/types';

import { pointsToBitmap } from '@/mandelbrot/utils/points-to-bitmap';
import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import { calcUnitsPerPixel, createZoomInfo } from '@/mandelbrot/zoom';
import { getTileGridRect } from '@/mandelbrot/tile';

interface ImageSpec {
  x: number;
  y: number;
  width: number;
  height: number;
}

function coord2str(coord: TileCoord) {
  return `${coord.x}, ${coord.y}, ${coord.z}`;
}

async function renderTile(
  canvas: HTMLCanvasElement,
  tile: TileResult,
  params: FrozenRenderParams,
) {
  const view = { width: canvas.width, height: canvas.height };
  const region = regionForView(params.center, view, params.zoom);
  const grid = getTileGridRect(params, view);
  // console.log('### grid ###',
  //   'topLeft:', coord2str(grid.topLeft),
  //   '--- botRight:', coord2str(grid.botRight));
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

  const tf2 = (n: number) => n.toFixed(2);

  const coordStr = `${coord.x}, ${coord.y}, ${coord.z}`;
  // if (coordStr === '-6, -2, 4') {
  //   console.log(
  //     `tile: ${coordStr}`,
  //     `source: (${source.x}, ${source.y}, ${tf2(source.width)}, ${tf2(source.height)})`,
  //     `dest: (${dest.x}, ${dest.y}, ${tf2(dest.width)}, ${tf2(dest.height)})`,
  //   );
  // }

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

  await renderRegionData(canvas, tile.data, source, dest, coordStr);
}

async function renderRegionData(
  canvas: HTMLCanvasElement,
  data: RegionData,
  source: ImageSpec,
  dest: ImageSpec,
  debugText?: string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  try {
    let imgBitmap = await pointsToBitmap(data);
    if (debugText) {
      imgBitmap = await addTextToBitmap(imgBitmap, debugText);
    }

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

async function addTextToBitmap(imageBitmap: ImageBitmap, text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');
  ctx.drawImage(imageBitmap, 0, 0);

  ctx.font = '10px Arial';
  ctx.fillStyle = 'red';
  ctx.fillText(text, 5, 10);

  // Return new ImageBitmap
  return createImageBitmap(canvas);
}

export { renderTile };
