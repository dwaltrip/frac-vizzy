import { ColorMapper, TileResult } from '@/mandelbrot/types';

import { getTileId } from '@/mandelbrot/tile-id';
import { pointsToBitmap } from '@/mandelbrot/utils/points-to-bitmap';
import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import { getTileDrawImageArgs } from '@/mandelbrot/render/tile-draw-image-args';

async function renderTile(
  canvas: HTMLCanvasElement,
  tile: TileResult,
  params: FrozenRenderParams,
  getColor: ColorMapper,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D context not available');
  }

  const { source, dest } = getTileDrawImageArgs(tile.params, params, {
    width: tile.data.length,
    height: tile.data[0].length,
  });

  try {
    const imgBitmap = await pointsToBitmap(tile.data, getColor);
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
    const tileId = getTileId(tile.params);
    console.error(`Tile (${tileId}) render error`);
    throw error;
  }
}

export { renderTile };
