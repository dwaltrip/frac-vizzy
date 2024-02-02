import { TileCoord, TileID } from '@/mandelbrot/types';
import {
  RenderParams,
  FrozenRenderParams,
} from '@/mandelbrot/params/render-params';
import { calculateVisibleTilesUsingUpscaling } from '@/mandelbrot/tile';

enum RenderJobStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
}

class RenderJob {
  params: FrozenRenderParams;
  status: RenderJobStatus = RenderJobStatus.CREATED;

  private _targetTiles: TileCoord[];
  private _renderedTiles: Set<TileID> = new Set();

  constructor(params: FrozenRenderParams) {
    this.params = params;

    const { center, zoom, tileSizePx, view } = this.params;
    this._targetTiles = calculateVisibleTilesUsingUpscaling(
      { center, zoom, defaultTileSizePx: tileSizePx },
      view,
    );
  }
}

export { RenderJob, RenderJobStatus };
