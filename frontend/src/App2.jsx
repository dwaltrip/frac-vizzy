import React, { useEffect, useRef, useState } from 'react';

import { drawPixel } from './lib/draw';

// ----------------------------------------------------------------------------


const IMAGE_SIZE = { width: 1200, height: 1200 };
// const IMAGE_SIZE = { width: 600, height: 600 };
// const IMAGE_SIZE = { width: 150, height: 150 };

const MARGIN = 30;
const TILE_SIZE = {
  height: IMAGE_SIZE.height - (MARGIN * 2),
  width: IMAGE_SIZE.width - (MARGIN * 2),
};

const RAW_DATA = createGradientTile(
  { r: 220, b: 170, b: 60, },
  { r: 30, b: 30, b: 150, },
  TILE_SIZE,
);

function App() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "rgb(240,230,200)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imageData = ctx.createImageData(TILE_SIZE.width, TILE_SIZE.height);
    drawTile(imageData, RAW_DATA);
    ctx.putImageData(imageData, MARGIN, MARGIN);
  }, [canvasRef]);

  return (
    <div className='app-2'>
      <h3>Smooth Panning Proof-of-Concept</h3>

      <canvas
        height={IMAGE_SIZE.height}
        width={IMAGE_SIZE.width}
        ref={canvasRef}
      >
      </canvas>
    </div>
  );
}

// ----------------------------------------------------------------------------

function drawTile(imageData, tile) {
  const tileHeight = tile.length;
  const tileWidth = tile[0].length;

  if ((imageData.height !== tileHeight) || (imageData.width !== tileWidth)) {
    throw new Error('tile does not match imageData');
  }

  for (let y=0; y < tileHeight; y++) {
    const row = tile[y];

    for (let x=0; x < row.length; x++) {
      const pixel = row[x];
      drawPixel(imageData, x, y, pixel.r, pixel.g, pixel.b);
    }
  }
}

function createGradientTile(color1, color2, size) {
  const { height, width } = size;
  const tile = [];

  for (let y=0; y<height; y++) {
    const row = [];

    for (let x=0; x<width; x++) {
      const percent = (x + y) / (width + height);
      row.push({
        r: percentToRangeVal(percent, color1.r, color2.r),
        g: percentToRangeVal(percent, color1.g, color2.g),
        b: percentToRangeVal(percent, color1.b, color2.b),
      });
    }
    tile.push(row);
  }

  return tile;
}

function percentToRangeVal(percent, start, end) {
  return Math.floor(start + (percent * (end - start)));
}

// ----------------------------------------------------------------------------

export default App;
