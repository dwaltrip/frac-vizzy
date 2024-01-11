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

type TileCoord = {
  x: number;
  y: number;
  z: number; // enforced to be an integer???
};

type ZoomInfo = {
  value: number;
  tileSizePx: number;
  tileSize: number;
  pxToMath: number;
};

type FrozenRenderParams = DeepReadonly<{
  center: ComplexNum;
  zoom: number;
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
  type ZoomInfo,
  type FrozenRenderParams,
  type ComplexRegion,
  type Viewport,
  type MousePos,
};
