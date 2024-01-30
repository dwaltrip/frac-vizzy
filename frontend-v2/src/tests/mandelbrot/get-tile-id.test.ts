import { describe, it, expect } from 'vitest';

import { getTileId } from '@/mandelbrot/tile-id';

describe('getTileId', () => {
  const id = getTileId({ coord: { x: 0, y: 0, z: 0 }, iters: 100 });

  it('should return a string', () => {
    expect(typeof id).toBe('string');
  });
  it('should have the correct format', () => {
    expect(id).toBe('(x=0,y=0,z=0,iters=100)');
  });
});
