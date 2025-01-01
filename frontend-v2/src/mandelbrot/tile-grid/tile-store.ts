import { BasicCache } from '@/lib/basic-cache';

import {
  TileCalcStatus,
  TileData,
  TileID,
  TileParams,
  TileResult,
} from '@/mandelbrot/types';
import { invariant } from '@/utils/invariant';

interface TileInfo {
  params: TileParams;
  calcStatus: TileCalcStatus;
  data: TileData | null;
}

class TileStore {
  private cache = new BasicCache<TileInfo>();

  get(tileId: TileID): [TileCalcStatus, TileResult | null] {
    if (this.cache.has(tileId)) {
      const { params, calcStatus, data } = this.cache.get(tileId);
      if (calcStatus === 'complete') {
        return [calcStatus, { params, data: data! }];
      }
      return [calcStatus, null];
    }
    return ['not started', null];
  }

  getStatus(tileId: TileID): TileCalcStatus {
    if (this.cache.has(tileId)) {
      return this.cache.get(tileId).calcStatus;
    }
    return 'not started';
  }

  setAsInProgress(tileId: TileID, params: TileParams) {
    invariant(
      !this.cache.has(tileId),
      `TileStore.setAsInProgress - tileId ${tileId} already exists`,
    );
    this.cache.set(tileId, {
      params,
      calcStatus: 'in progress',
      data: null,
    });
  }

  cacheResult(tileId: TileID, result: TileResult) {
    const { calcStatus } = this.cache.get(tileId);
    invariant(
      calcStatus === 'in progress',
      `TileStore.cacheResult - can only cache results for tiles in progress`,
    );
    this.cache.set(tileId, {
      params: result.params,
      calcStatus: 'complete',
      data: result.data,
    });
  }
}

export { TileStore };
