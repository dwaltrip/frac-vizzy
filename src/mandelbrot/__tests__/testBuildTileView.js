import { getViewportInfo } from '../../viewport';
import { getTileIds } from '../getTileIds';
import { buildTileView } from '../drawTile';

describe('Test build tile view', () => {
  const testCases = [
    {
      description: 'Initial plot on 700x700 canvas',
      canvas: { height: 700, width: 700 },
      params: {
        centerPos: { r: 0, c: 0 },
        iterationLimit: 250,
        zoomLevel: 1,
      },
    },
  ];

  testCases.forEach(({ description, ...args }) => {
    describe(description, () => {
      testBuildTileView(args);
    });
  });
});

// ----------------------------------------------------------------------------

function testBuildTileView({ canvas, params }) {
  // --- Setup ---

  const viewport = getViewportInfo({ params, canvas });
  const { centerPos, zoomLevel } = params;

  const tileIds = getTileIds({ centerPos, zoomLevel, viewport });
  const tileIdsFlat = tileIds.flat();

  const tileViews = tileIds.map(row => {
    return row.map(tileId => buildTileView({ tileId, viewport }));
  });

  // --- Assertions ---

  test('visible tile heights add up to viewport height', () => {
    const heightForTiles = tileViews.reduce((memo, row) => {
      const leftMostTile = row[0];
      return memo + leftMostTile.visibleSection.height;
    }, 0);

    expect(heightForTiles).toEqual(viewport.height);
  });

  test('visible tile widths to add up to viewport width', () => {
    tileViews.forEach(row => {
      const widthForTiles = row.reduce((memo, tile) => {
        return memo + tile.visibleSection.width;
      }, 0);

      expect(widthForTiles).toEqual(viewport.width);
    });
  });
}
