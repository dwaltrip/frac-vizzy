import { TileCoord, TileID, TileParams, TileResult } from '@/mandelbrot/types';

import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import {
  calculateVisibleTilesUsingUpscaling,
  getTileGridRect,
} from '@/mandelbrot/tile';
import { getTileId } from '@/mandelbrot/tile-id';
import { renderTile } from '@/mandelbrot/render-tile';
import { IdGenerator } from '@/lib/backburner/id-generator';

enum RenderJobStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
}

const generateId = IdGenerator.asFunc(4);

class RenderJob {
  canvas: HTMLCanvasElement;
  params: FrozenRenderParams;
  status: RenderJobStatus = RenderJobStatus.CREATED;

  private _id: string = generateId();
  private _targetTiles: TileCoord[];
  private _renderedTiles: Set<TileID> = new Set();

  constructor(params: FrozenRenderParams, canvas: HTMLCanvasElement) {
    this.params = params;
    this.canvas = canvas;

    const { center, zoom, tileSizePx, view } = this.params;
    this._targetTiles = calculateVisibleTilesUsingUpscaling(
      { center, zoom, defaultTileSizePx: tileSizePx },
      view,
    );
  }

  get id(): string {
    return this._id;
  }

  get isComplete(): boolean {
    return this.status === RenderJobStatus.COMPLETE;
  }

  get targetTiles(): TileParams[] {
    return this._targetTiles.map((tc) => ({
      coord: tc,
      iters: this.params.iters,
    }));
  }

  async render(getTile: (tileId: TileID) => TileResult | null) {
    if (this.status !== RenderJobStatus.CREATED) {
      throw new Error('RenderJob.render - Invalid render job status');
    }

    const p = this.params;
    const tileSizePx = p.tileSizePx;
    // -- PARAMS_OLD_FORMAT --
    // TODO: get rid of this old format
    const paramsOldFmt = {
      center: p.center,
      zoom: p.zoom,
      defaultTileSizePx: tileSizePx,
    };
    const tileGridRect = getTileGridRect(paramsOldFmt, p.view);
    const topLeftTileCoord = tileGridRect.topLeft;

    this.clearCanvas();

    for (const tp of this.targetTiles) {
      const tileId = getTileId(tp);
      const tile = getTile(tileId);
      if (!tile) return;

      await renderTile(
        tile,
        topLeftTileCoord,
        this.canvas,
        paramsOldFmt,
        tileSizePx,
      );
      this._renderedTiles.add(tileId);
    }

    if (this._renderedTiles.size === this._targetTiles.length) {
      this.status = RenderJobStatus.COMPLETE;
    }
  }

  // TODO: do we need this?
  cancel() {
    this.status = RenderJobStatus.CANCELED;
  }

  clearCanvas() {
    const ctx = this.canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export { RenderJob, RenderJobStatus };
