import { getTileIds } from './getTileIds';


const tilesToComputeQueue = {
  _queue: [],

  update(tileIds) {
    this._queue = [...tileIds];
  }
};

// TODO: This is basically "drawMandelbrot" v2. Fix the naming later.
function renderMandelbrot({ canvas, params, systemParams, onProgress }) {
     // * Figure out which tiles needed for new params
    const tileIds = getTileIds({
      centerPos, 
      zoomLevel,
      viewport,
      cacheParams: { iterationLimit },
    }).flat();

    // * Update the "tiles to compute" queue (TTCQ) for the new list of tiles
    tilesToComputeQueue.update(tileIds);

    // * Start workers if they are not already running 
    computeManagerV2.startNWorkers(systemParams.numWorkers);

    // * Workers keep pulling from the TTCQ until it's empty

    // * As soon as a worker finishes computing a tile,
    //   it is rendered in the correct location in the viewport. 
 
}
