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

type TileData = SetStatus[][];

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

interface TileResult {
  params: TileParams;
  data: TileData;
}

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
  type TileData,
  type TileParams,
  type TileResult,
  type FrozenRenderParams,
  type ComplexRegion,
  type Viewport,
  type MousePos,
};
