import { describe, it, expect } from 'vitest';

import {
  getParentTileInfo,
  getCornerSliceIndices,
  getChildTiles,
} from '@/mandelbrot/tile-grid/parent-info';

describe('Tile Coordinate Utils', () => {
  describe('getParentTileInfo', () => {
    // Test all four corners of (3,4,3)
    it('correctly identifies parent and corner for children of (3,4,3)', () => {
      const botLeft = getParentTileInfo({ x: 6, y: 7, z: 4 });
      const topLeft = getParentTileInfo({ x: 6, y: 8, z: 4 });
      const botRight = getParentTileInfo({ x: 7, y: 7, z: 4 });
      const topRight = getParentTileInfo({ x: 7, y: 8, z: 4 });

      // All should have the same parent
      const expectedParent = { x: 3, y: 4, z: 3 };
      expect(botLeft.parent).toEqual(expectedParent);
      expect(topLeft.parent).toEqual(expectedParent);
      expect(botRight.parent).toEqual(expectedParent);
      expect(topRight.parent).toEqual(expectedParent);

      // Check corners are correctly identified
      expect(botLeft.corner).toBe('botLeft');
      expect(topLeft.corner).toBe('topLeft');
      expect(botRight.corner).toBe('botRight');
      expect(topRight.corner).toBe('topRight');
    });

    // Test with a different parent
    it('correctly identifies parent and corner for children of (1,2,1)', () => {
      const child = getParentTileInfo({ x: 2, y: 3, z: 2 });
      expect(child.parent).toEqual({ x: 1, y: 2, z: 1 });
      expect(child.corner).toBe('botLeft');
    });

    // Test at higher zoom levels
    it('works correctly at higher zoom levels', () => {
      const child = getParentTileInfo({ x: 5, y: 6, z: 3 });
      expect(child.parent).toEqual({ x: 2, y: 3, z: 2 });
      expect(child.corner).toBe('topRight');
    });
  });

  describe('getChildTiles', () => {
    it('correctly generates all four children of (3,4,3)', () => {
      const parent = { x: 3, y: 4, z: 3 };
      const children = getChildTiles(parent);

      expect(children).toEqual({
        topLeft: { x: 6, y: 8, z: 4 },
        topRight: { x: 7, y: 8, z: 4 },
        botLeft: { x: 6, y: 7, z: 4 },
        botRight: { x: 7, y: 7, z: 4 },
      });
    });

    it('correctly generates children for a different parent', () => {
      const parent = { x: 1, y: 2, z: 1 };
      const children = getChildTiles(parent);

      expect(children).toEqual({
        topLeft: { x: 2, y: 4, z: 2 },
        topRight: { x: 3, y: 4, z: 2 },
        botLeft: { x: 2, y: 3, z: 2 },
        botRight: { x: 3, y: 3, z: 2 },
      });
    });
  });

  describe('getCornerSliceIndices', () => {
    it('returns correct indices for each corner of a 256px tile', () => {
      const TILE_SIZE = 256;

      expect(getCornerSliceIndices('topLeft', TILE_SIZE)).toEqual({
        x: { start: 0, end: 128 },
        y: { start: 0, end: 128 },
      });

      expect(getCornerSliceIndices('topRight', TILE_SIZE)).toEqual({
        x: { start: 128, end: 256 },
        y: { start: 0, end: 128 },
      });

      expect(getCornerSliceIndices('botLeft', TILE_SIZE)).toEqual({
        x: { start: 0, end: 128 },
        y: { start: 128, end: 256 },
      });

      expect(getCornerSliceIndices('botRight', TILE_SIZE)).toEqual({
        x: { start: 128, end: 256 },
        y: { start: 128, end: 256 },
      });
    });
  });

  describe('Round trip tests', () => {
    it('parent of child should match original tile', () => {
      const originalParent = { x: 3, y: 4, z: 3 };
      const children = getChildTiles(originalParent);

      [
        children.topLeft,
        children.topRight,
        children.botLeft,
        children.botRight,
      ].forEach((child) => {
        const parentInfo = getParentTileInfo(child);
        expect(parentInfo.parent).toEqual(originalParent);
      });
    });
  });
});
