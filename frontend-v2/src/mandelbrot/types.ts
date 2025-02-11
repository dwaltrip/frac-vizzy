import { DeepReadonly } from '@/types';

type ComplexNum = {
  re: number;
  im: number;
};

type BBox = {
  topLeft: ComplexNum;
  botRight: ComplexNum;
};

type SetStatus = {
  isInSet: boolean;
  iters: number;
};
type SetStatusOrSkipped = SetStatus | null;

type RegionData = SetStatus[][];
type TileData = RegionData;

type PartialRegionData = SetStatusOrSkipped[][];
type PartialTileData = PartialRegionData;

type TileCoord = {
  x: number;
  y: number;
  z: number; // enforced to be an integer???
};

type TileID = string;

interface TileParams {
  coord: TileCoord;
  iters: number;
}

interface TileCalcTask {
  params: TileParams;
  context: {
    renderId: string;
  };
}

type TileCalcStatus = 'not started' | 'in progress' | 'complete';

interface TileResult {
  params: TileParams;
  data: TileData;
}

type TileCorner = 'topLeft' | 'topRight' | 'botLeft' | 'botRight';

type ParentInfo = {
  parent: TileCoord;
  child: TileCoord;
  corner: TileCorner;
};

type FrozenRenderParams = DeepReadonly<{
  center: ComplexNum;
  zoom: number;
  defaultTileSizePx: number;
}>;

type ComplexRegion = {
  width: number;
  height: number;
  topLeft: ComplexNum;
};

// (x,y) coords for pixels. starting from top left of canvas, which is (0,0)
interface PixelCoord {
  x: number;
  y: number;
}

type Rect = {
  width: number;
  height: number;
};

type MousePos = {
  x: number;
  y: number;
};

namespace Color {
  export type RGB = { r: number; g: number; b: number };
  export type RGBA = { r: number; g: number; b: number; a?: number };
  export type HSL = { h: number; s: number; l: number };
}

type ColorMapper = (status: SetStatus) => Color.RGB;

// TODO: Break these up into domain-specific files
export {
  type ComplexNum,
  type BBox,
  type SetStatus,
  type SetStatusOrSkipped,
  type TileCoord,
  type TileID,
  type RegionData,
  type TileData,
  type PartialRegionData,
  type PartialTileData,
  type TileParams,
  type TileCalcTask,
  type TileCalcStatus,
  type TileResult,
  type ParentInfo,
  type TileCorner,
  type FrozenRenderParams,
  type ComplexRegion,
  type Rect,
  type PixelCoord,
  type MousePos,
  type Color,
  type ColorMapper,
};
