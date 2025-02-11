import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import { Color, TileParams } from '@/mandelbrot/types';
import { getTileDrawImageArgs } from '@/mandelbrot/render/tile-draw-image-args';

function renderGridlines(
  canvas: HTMLCanvasElement,
  tile: TileParams,
  params: FrozenRenderParams,
  color: Color.RGBA,
) {
  const { dest } = getTileDrawImageArgs(tile, params);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }

  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a ?? 1})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  // This draws gridlines for the left and top edges of the tile.
  // The bottom and right edges are the top and left of the neighboring tiles,
  // so we don't draw them, as they would overlap.
  // This might not be a problem with solid lines, but it messes up dashed lines.
  ctx.beginPath();
  ctx.moveTo(dest.x, dest.y + dest.height); // bottom left
  ctx.lineTo(dest.x, dest.y); // top left
  ctx.lineTo(dest.x + dest.width, dest.y); // top right
  ctx.stroke();
}

export { renderGridlines };
