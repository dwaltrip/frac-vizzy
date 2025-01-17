import {
  ColorMapper,
  TileCoord,
  TileID,
  TileParams,
  TileResult,
} from '@/mandelbrot/types';

import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import { calculateVisibleTilesUsingUpscaling } from '@/mandelbrot/tile';
import { getTileId } from '@/mandelbrot/tile-id';
import { TileStore } from '@/mandelbrot/tile-grid/tile-store';
import {
  getParentTileInfo,
  getCornerSliceIndices,
} from '@/mandelbrot/tile-grid/parent-info';

import { renderTile } from '@/mandelbrot/render-tile-data';
import { IdGenerator } from '@/lib/backburner/id-generator';

enum RenderJobStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
}

const generateId = IdGenerator.asFunc(4);

interface RenderJobHooks {
  onCompletion?: () => void;
}

class RenderJob {
  canvas: HTMLCanvasElement;
  params: FrozenRenderParams;
  tileStore: TileStore;

  status: RenderJobStatus = RenderJobStatus.CREATED;

  // getColor: ColorMapper;

  private _id: string = generateId();
  private _targetTiles: TileCoord[];
  private _renderedTiles: Set<TileID> = new Set();
  private hooks: RenderJobHooks = {};

  constructor(
    params: FrozenRenderParams,
    canvas: HTMLCanvasElement,
    tileStore: TileStore,
    // getColor: ColorMapper,
    hooks: RenderJobHooks,
  ) {
    // params are the "target" params for this render
    this.params = params;
    this.canvas = canvas;
    this.tileStore = tileStore;
    // this.getColor = getColor;
    this.hooks = hooks;

    const view = params.view;
    // TODO: this feels kind of hidden... probably doesn't belong here.
    // Probably should be calculated in `mandelbrot` or something like that,
    // and passed into each new RenderJob.
    this._targetTiles = calculateVisibleTilesUsingUpscaling(this.params, view);
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

  async render(getColor: ColorMapper) {
    // if (this.status !== RenderJobStatus.CREATED) {
    //   throw new Error('RenderJob.render - Invalid render job status');
    // }

    this.clearCanvas();

    let skipCount = 0;
    for (const tp of this.targetTiles) {
      const tileId = getTileId(tp);

      const [calcStatus, tileResult] = this.tileStore.get(tileId);

      if (calcStatus === 'complete' && tileResult) {
        // TODO: we are passing in the color mapper down through like 7 levels
        // of function calls. Feels smelly, is there a better structure?
        await renderTile(this.canvas, tileResult, this.params, getColor);
        this._renderedTiles.add(tileId);
      } else {
        skipCount += 1;
        const parentInfo = getParentTileInfo(tp.coord);
        const parentId = getTileId({
          coord: parentInfo.parent,
          // TODO: We are only looking at the parent tile w/ matching iters,
          // but in theory we could look at parents with "close enough" iters as well
          iters: tp.iters,
        });
        const [parentStatus, parentResult] = this.tileStore.get(parentId);

        // The tile isn't ready yet. So we crop and scale the matching quadrant of the
        // parent tile, and render that until the tile is ready.
        if (parentStatus === 'complete' && parentResult) {
          const { x: ix, y: iy } = getCornerSliceIndices(
            parentInfo.corner,
            this.params.baseTileSizePx,
          );
          const lowResTempTile: TileResult = {
            params: {
              coord: tp.coord,
              iters: tp.iters,
            },
            data: parentResult.data
              .slice(iy.start, iy.end)
              .map((row) => row.slice(ix.start, ix.end)),
          };
          await renderTile(this.canvas, lowResTempTile, this.params, getColor);
        }
      }
    }

    // TODO Is there a better way to know we are done rendering?
    // Feels slightly brittle. It might be fine though.
    if (this._renderedTiles.size === this._targetTiles.length) {
      this.status = RenderJobStatus.COMPLETE;

      this.hooks.onCompletion && this.hooks.onCompletion();
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
