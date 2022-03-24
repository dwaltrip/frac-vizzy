import { assert } from './lib/assert';

// ----------------------------------------------------------------------------

const TILE_SIDE_LENGTH_IN_PIXELS = 50;

const DEFAULT_VIEWPORT = {
  width: 700,
  height: 700,
};

// ----------------------------------------------------------------------------

const COLOR_METHODS = {
  sqrt_iters: 'sqrt_iters',
  exp_3div4_iters: 'exp_3div4_iters',
  log_iters: 'log_iters',
  div_by_20: 'div_by_20',
  histogram: 'histogram',
  histogram2: 'histogram2',
};

const COLOR_METHOD_OPTS = [
  {

    value: COLOR_METHODS.sqrt_iters,
    text: 'sqrt(iterations)',
  },
  {
    value: COLOR_METHODS.exp_3div4_iters,
    text: 'iterations^(3/4)',
  },
  {
    value: COLOR_METHODS.log_iters,
    text: 'log(iterations)',
  },
  {
    value: COLOR_METHODS.histogram,
    text: 'histogram',
  },
  {
    value: COLOR_METHODS.histogram2,
    text: 'histogram2',
  },
  {
    value: COLOR_METHODS.div_by_20,
    text: 'iterations / 20'
  },
];

// ----------------------------------------------------------------------------

export {
  TILE_SIDE_LENGTH_IN_PIXELS,
  DEFAULT_VIEWPORT,

  COLOR_METHODS,
  COLOR_METHOD_OPTS,
};
