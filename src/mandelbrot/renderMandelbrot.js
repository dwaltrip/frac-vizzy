import { getTileIds } from './getTileIds';


const tilesToComputeQueue = {
  _queue: [],

  update(tileIds) {
    this._queue = [...tileIds];
  }
};

// TODO: This is basically "drawMandelbrot" v2. Fix the naming later.
function renderMandelbrot({ canvas, params, ComputeManager, onProgress }) {
   // * Figure out which tiles needed for new params
  const tileIds = getTileIds({
    centerPos, 
    zoomLevel,
    viewport,
    cacheParams: { iterationLimit },
  }).flat();

  // * Update the "tiles to compute" queue (TTCQ) for the new list of tiles
  tilesToComputeQueue.update(tileIds);

  // * Workers keep pulling from the TTCQ until it's empty
  ComputeManager.computePlotV2(tileIds)

  // * As soon as a worker finishes computing a tile,
  //   it is rendered in the correct location in the viewport.
  
  // return ComputeManager.computePlot({
  //   computeArgs,
  //   onProgress,
  //   handleNewTile: ({ tileId, points }) => {
  //     drawTile({ ctx, tileId, points, viewport, getColor: getColorFirstPass });
  //   },
  // }).then(tiles => {
  //   // ......
  // });
}
