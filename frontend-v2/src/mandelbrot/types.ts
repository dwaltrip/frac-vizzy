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

type RegionData = SetStatus[][];
type TileData = RegionData;

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

type Viewport = {
  width: number;
  height: number;
};

type MousePos = {
  x: number;
  y: number;
};

// TODO: Break these up into domain-specific files
export {
  type ComplexNum,
  type BBox,
  type SetStatus,
  type TileCoord,
  type TileID,
  type RegionData,
  type TileData,
  type TileParams,
  type TileCalcTask,
  type TileCalcStatus,
  type TileResult,
  type ParentInfo,
  type TileCorner,
  type FrozenRenderParams,
  type ComplexRegion,
  type Viewport,
  type MousePos,
};
