import { ColorMapper, TileResult } from '@/mandelbrot/types';

import { invariant } from '@/utils/invariant';
import { getContext2dSafe } from '@/lib/get-context-2d-safe';

import { getTileId } from '@/mandelbrot/tile-id';
import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import { getTileDrawImageArgs } from '@/mandelbrot/render/tile-draw-image-args';
import { drawPoints } from '@/mandelbrot/draw';
import { DEFAULT_CANVAS_BG } from '@/mandelbrot/viz/style-constants';

// TODO: consider refactoring, into maybe something like TileRenderer
// that just holds a reference to the validated offscreen canvas
// it's silly to check each time like we do in this function
async function renderTile(
  canvas: HTMLCanvasElement,
  tmp: OffscreenCanvas,
  tile: TileResult,
  params: FrozenRenderParams,
  getColor: ColorMapper,
) {
  const ctx = getContext2dSafe(canvas);
  const tmpCtx = getContext2dSafe(tmp);

  const height = tile.data.length;
  const width = tile.data[0].length;
  // ensure offscreen canvas size matches the tile data size
  invariant(tmp.width === width && tmp.height === height, 'size mismatch');

  const { source, dest } = getTileDrawImageArgs(tile.params, params, {
    width,
    height,
  });

  try {
    const { r, g, b } = DEFAULT_CANVAS_BG;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    tmpCtx.fillRect(0, 0, tmp.width, tmp.height);

    // TODO: check out if we can reuse imageData vs. create a new one each time
    const imgData = tmpCtx.createImageData(width, height);
    drawPoints(imgData, tile.data, getColor);
    tmpCtx.putImageData(imgData, 0, 0);

    // --------------------------------------------------------------------------------
    // The comment below is from when we were using bitmaps, but leaving it for now,
    // as I'd like to have a way of doing the same thing with the offscreen canvas.
    // TODO: implement debug text for offscreen canvas
    // --------------------------------------------------------------------------------
    // NOTE: Using `addTextToBitmap` is great for getting a live "debug" view of tile-level stuff
    // const debugInfo = `${coord.x}, ${coord.y}, ${coord.zoom} (${someDebugData})`;
    // let imgBitmap = await pointsToBitmap(tile.data, getColor);
    // imgBitmap = await addTextToBitmap(imgBitmap, debugInfo, {
    //   fontSize: 8,
    //   padding: 2,
    // });

    ctx.drawImage(
      tmp,
      ...[source.x, source.y, source.width, source.height],
      ...[dest.x, dest.y, dest.width, dest.height],
    );
  } catch (error) {
    const tileId = getTileId(tile.params);
    console.error(`Tile (${tileId}) render error`);
    throw error;
  }
}

export { renderTile };
