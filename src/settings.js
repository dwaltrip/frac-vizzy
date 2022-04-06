import { assert } from './lib/assert';

// ----------------------------------------------------------------------------

const TILE_SIDE_LENGTH_IN_PIXELS = 50;

const DEFAULT_VIEWPORT = {
  width: 700,
  height: 700,
};

// ----------------------------------------------------------------------------

const COLOR_METHODS = {
  linear_iters: 'linear_iters',
  sqrt_iters: 'sqrt_iters',
  histogram: 'histogram',
  histogram2: 'histogram2',
};

const COLOR_METHOD_OPTS = [
  {
    value: COLOR_METHODS.linear_iters,
    text: 'linear',
  },
  {

    value: COLOR_METHODS.sqrt_iters,
    text: 'square root',
  },
  {
    value: COLOR_METHODS.histogram,
    text: 'histogram',
  },
  {
    value: COLOR_METHODS.histogram2,
    text: 'histogram 2',
  },
];

// ----------------------------------------------------------------------------

export {
  TILE_SIDE_LENGTH_IN_PIXELS,
  DEFAULT_VIEWPORT,

  COLOR_METHODS,
  COLOR_METHOD_OPTS,
};
