// TODO: I don't it makes sense for this file to be in the /params subdir
import { IdGenerator } from '@/lib/backburner/id-generator';

import {
  ColorMapper,
  TileData,
  TileID,
  TileParams,
  TileResult,
} from '@/mandelbrot/types';

import { FrozenRenderParams } from '@/mandelbrot/params/render-params';
import { getTileId } from '@/mandelbrot/tile-id';
import { TileStore } from '@/mandelbrot/tile-grid/tile-store';
import {
  getParentTileInfo,
  getCornerSliceIndices,
} from '@/mandelbrot/tile-grid/parent-info';
import { renderTile } from '@/mandelbrot/render-tile-data';
import { renderGridlines } from '@/mandelbrot/render/render-gridlines';
import {
  DEFAULT_CANVAS_BG,
  TILE_GRIDLINE_COLOR,
} from '@/mandelbrot/viz/style-constants';

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

type LinearColorMappers = ColorMapper;
type HistogramColorMappers = {
  during: ColorMapper;
  buildGetColorOnCompletion: (tilesData: TileData[]) => ColorMapper;
  after?: ColorMapper;
};
type RenderColorMappers = LinearColorMappers | HistogramColorMappers;

class RenderJob {
  canvas: HTMLCanvasElement;
  params: FrozenRenderParams;
  targetTiles: TileParams[];
  tileStore: TileStore;

  status: RenderJobStatus = RenderJobStatus.CREATED;

  colorMappers: RenderColorMappers;

  private _id: string = generateId();
  private _renderedTiles: Set<TileID> = new Set();
  private hooks: RenderJobHooks = {};

  constructor(
    params: FrozenRenderParams,
    targetTiles: TileParams[],
    tileStore: TileStore,
    canvas: HTMLCanvasElement,
    colorMappers: RenderColorMappers,
    hooks: RenderJobHooks,
  ) {
    // The "target" params for this render
    this.params = params;
    this.targetTiles = targetTiles;
    this.canvas = canvas;
    this.tileStore = tileStore;

    this.colorMappers = colorMappers;
    this.hooks = hooks;
  }

  get id(): string {
    return this._id;
  }

  get isComplete(): boolean {
    return this.status === RenderJobStatus.COMPLETE;
  }

  get allTilesAreCalculated(): boolean {
    return this.targetTiles.every((tp) => {
      const tileId = getTileId(tp);
      const [calcStatus] = this.tileStore.get(tileId);
      return calcStatus === 'complete';
    });
  }

  requireAllTileResults(): TileResult[] {
    return this.targetTiles.map((tp) => {
      const tileId = getTileId(tp);
      const [_, result] = this.tileStore.get(tileId);
      if (!result) {
        throw new Error(`Tile result not found for tileId: ${tileId}`);
      }
      return result;
    });
  }

  getColorMapper(): ColorMapper {
    const alg = this.params.colors.algorithm;
    if (alg === 'linear') {
      return this.colorMappers as LinearColorMappers;
    } else {
      const mappers = this.colorMappers as HistogramColorMappers;
      if (this.status === RenderJobStatus.COMPLETE) {
        assertAfterColorMapperExists(mappers.after);
        return mappers.after;
      } else {
        return mappers.during;
      }
    }
  }

  async render() {
    if (this.status !== RenderJobStatus.CREATED) {
      console.log('RenderJob.render', `(${this.id})`);
      throw new Error('RenderJob.render - Invalid render job status');
    }

    this.clearCanvas();

    const getColor = this.getColorMapper();

    for (const tp of this.targetTiles) {
      const tileId = getTileId(tp);

      const [calcStatus, tileResult] = this.tileStore.get(tileId);

      if (calcStatus === 'complete' && tileResult) {
        // TODO: we are passing in the color mapper down through like 7 levels
        // of function calls. Feels smelly, is there a better structure?
        await renderTile(this.canvas, tileResult, this.params, getColor);
        this._renderedTiles.add(tileId);
      } else {
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
        } else {
          renderGridlines(this.canvas, tp, this.params, TILE_GRIDLINE_COLOR);
        }
      }
    }

    // TODO: Is there a better way to know we are done rendering?
    // Feels slightly brittle. It might be fine though.
    if (this._renderedTiles.size === this.targetTiles.length) {
      this.status = RenderJobStatus.COMPLETE;
      this.postRender();
      this.hooks.onCompletion && this.hooks.onCompletion();
    }
  }

  private async postRender() {
    if (this.params.colors.algorithm === 'histogram') {
      const results = this.requireAllTileResults();
      const mappers = this.colorMappers as HistogramColorMappers;
      mappers.after = mappers.buildGetColorOnCompletion(
        results.map((r) => r.data),
      );

      const getColor = this.getColorMapper();
      for (const tileResult of results) {
        await renderTile(this.canvas, tileResult, this.params, getColor);
      }
    }
  }

  // TODO: Do we need this? We don't seem to need to check for cancellation anywhere.
  // The only place we call this creates a new render job.
  cancel() {
    this.status = RenderJobStatus.CANCELED;
  }

  clearCanvas() {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      const { r, g, b } = DEFAULT_CANVAS_BG;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

function assertAfterColorMapperExists(
  mapper: HistogramColorMappers['after'],
): asserts mapper is NonNullable<HistogramColorMappers['after']> {
  if (!mapper) {
    throw new Error('colorMappers.after should be set');
  }
}

export { RenderJob, RenderJobStatus };
