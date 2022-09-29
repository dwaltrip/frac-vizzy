
// TODO: use config files for API_URL and similar values.
const API_URL = 'http://localhost:8000';

const TILE_SIDE_LENGTH_IN_PIXELS = 50;

// These points draw a box around the fully zoomed out Mandelbrot
const BOUNDING_BOX = {
  topLeft: { r: -2, c: 1.2 },
  botRight: { r: 0.5, c: -1.2 },
};

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

export {
  API_URL,
  TILE_SIDE_LENGTH_IN_PIXELS,
  BOUNDING_BOX,
  COLOR_METHODS,
  COLOR_METHOD_OPTS,
};
