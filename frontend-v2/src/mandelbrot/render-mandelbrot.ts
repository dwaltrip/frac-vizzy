// import { ff, f3, f5, logNow, space } from '@/lib/misc';
import { f3, logNow } from '@/lib/misc';
import { perfStats } from '@/lib/perf-stats';

import {
  ComplexNum,
  TileCoord,
  ComplexRegion,
  FrozenRenderParams,
  Viewport,
  ZoomInfo,
} from '@/mandelbrot/types';
import {
  // calculateVisibleTiles,
  calculateVisibleTilesUsingUpscaling,
  computeTile,
} from '@/mandelbrot/tile';
import { calcPixelToComplexUnitScale } from '@/mandelbrot/zoom';

import {
  setTileInCache,
  getTileFromCache,
  isInCache,
} from '@/mandelbrot/tile-cache-basic';
import { pointsToBitmap } from '@/mandelbrot/utils/points-to-bitmap';

const TILE_ERR_COLOR = '#f0b0b0';

async function renderMandelbrot(
  canvas: HTMLCanvasElement,
  params: FrozenRenderParams,
  defaultTileSizePx: number,
): Promise<void> {
  const t0: number = performance.now();
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
  const zoomInfo = createZoomInfo(zoom, renderedTileSizePx);

  // const tilesToRender = calculateVisibleTileUsingDownscaling()
  const tilesToRender = calculateVisibleTilesUsingUpscaling(
    zoomInfo,
    params.center,
    view,
  );

  // TODO: This is brittle, we need better way of guaranteeing this is the top left
  const topLeftTile = tilesToRender[0];
  if (!topLeftTile) {
    console.warn('no tiles...???');
    return;
  }
  const topLeftTileTopLeft = {
    re: topLeftTile.x * zoomInfo.tileSize,
    im: topLeftTile.y * zoomInfo.tileSize,
  };
  const topLeftTileOffset = {
    re: topLeftTileTopLeft.re - region.topLeft.re,
    im: region.topLeft.im - topLeftTileTopLeft.im,
  };
  const topLeftTilePxOffset = {
    x: Math.round(topLeftTileOffset.re / zoomInfo.pxToMath),
    y: Math.round(topLeftTileOffset.im / zoomInfo.pxToMath),
  };

  const cacheHits = tilesToRender.filter((tile) => isInCache(tile)).length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const tile of tilesToRender) {
    const pxOffset = {
      x: topLeftTilePxOffset.x + (tile.x - topLeftTile.x) * zoomInfo.tileSizePx,
      y: topLeftTilePxOffset.y + (topLeftTile.y - tile.y) * zoomInfo.tileSizePx,
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
    // I did it for perf, but it'd be nice to verify that it actually matters.
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
      const imgBitamp = await fetchOrComputeTile(tile);
      const timer = perfStats.startTimer('ctx.drawImage');
      ctx.drawImage(
        imgBitamp,
        ...[source.x, source.y, source.width, source.height],
        ...[dest.x, dest.y, dest.width, dest.height],
      );
      timer.end();
    } catch (error) {
      console.error('Tile computation error:', error);
      ctx.fillStyle = TILE_ERR_COLOR;
      ctx.fillRect(...[dest.x, dest.y, dest.width, dest.height]);
    }
  }
  const t1 = performance.now();
  const msg = [
    `^_^ renderMandelbrot took ${(t1 - t0).toFixed(2)} ms.`,
    `Cache hits: ${cacheHits}/${tilesToRender.length}, Zoom: ${f3(zoom)}`,
  ].join(' ');
  // console.log(space(12) + `center: (${params.center.re}, ${params.center.im})`);
  logNow(msg);
}

function createZoomInfo(zoom: number, rawTileSizePx: number): ZoomInfo {
  const tileSizePx = rawTileSizePx;
  // console.log('tileSizePx:', tileSizePx, '-- rounded:', Math.round(tileSizePx))
  const pxToMath = calcPixelToComplexUnitScale(zoom);
  return {
    value: zoom,
    tileSizePx,
    tileSize: tileSizePx * pxToMath,
    pxToMath,
  };
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

// function fetchOrComputeTile(tile: TileCoord): SetStatus[][] {
async function fetchOrComputeTile(tile: TileCoord): Promise<ImageBitmap> {
  const cachedImgBitmap = getTileFromCache(tile);

  if (cachedImgBitmap) {
    return cachedImgBitmap;
  } else {
    const points = computeTile(tile);
    const imgBitmap = await pointsToBitmap(points);
    setTileInCache(tile, imgBitmap);
    return imgBitmap;
  }
}

export { renderMandelbrot };
