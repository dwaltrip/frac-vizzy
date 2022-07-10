import React, { useEffect, useRef, useState } from 'react';

import { Pannable } from './ui/Pannable';
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

const CANVAS_SIZE = {
  height: 600,
  width: 800,
};

const RAW_DATA = createGradientTile(
  { r: 220, b: 170, b: 60, },
  { r: 30, b: 30, b: 150, },
  TILE_SIZE,
);

function App() {
  const canvasRef = useRef();
  const [topLeft, setTopLeft] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "rgb(240,230,200)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imageData = drawTile(
      RAW_DATA,
      ctx,
      { height: canvas.height, width: canvas.width },
      topLeft,
    );
    ctx.putImageData(imageData, MARGIN, MARGIN);
  }, [canvasRef]);

  useEffect({
  }, [topLeft])

  const onPan = panVector => {
    const canvas = canvasRef.current;
    const clamp = true;

    const dx = panVector.x;
    const dy = panVector.y; // y flipped?
    const slope = dy / dx;

    let xRatio = dx / canvas.width;
    let yRatio = dy / canvas.height;

    if (clamp && (dx > canvas.width || dy > canvas.height)) {
      // overshooting harder in the x direction
      if (xRatio > yRatio) {
        xRatio = 1;
        yRatio = slope;
      }
      // overshooting harder in the y direction
      else {
        xRatio = 1 / slope;
        yRatio = 1;
      }
    }

    const adx = xRatio * canvas.width;
    const ady = yRatio * canvas.height;

    setTopLeft({
      x: topLeft.x + (xRatio * canvas.width),
      y: topLeft.y + (yRatio * canvas.height),
    });
  };

  return (
    <div className='app-2'>
      <h3>Smooth Panning Proof-of-Concept</h3>

      <Pannable onPan={onPan} throttleDelay={100}>
        <canvas
          height={IMAGE_SIZE.height}
          width={IMAGE_SIZE.width}
          ref={canvasRef}
        >
        </canvas>
      </Pannable>
    </div>
  );
}

// ----------------------------------------------------------------------------

function drawTile(tile, ctx, viewport, topLeft) {
  const tileHeight = tile.length;
  const tileWidth = tile[0].length;

  const imageData = ctx.createImageData(viewport.width, viewport.height);

  // if ((imageData.height !== tileHeight) || (imageData.width !== tileWidth)) {
  //   throw new Error('tile does not match imageData');
  // }

  console.log('=== viewport:', viewport)
  console.log('=== tile dims -- height:', tileHeight, '-- width:', tileWidth);
  console.log('=== topLeft:', topLeft)


  for (let y=topLeft.y; y < viewport.height; y++) {
    const row = tile[y];

    for (let x=topLeft.x; x < viewport.width; x++) {
      const pixel = row[x];
      if (!pixel) {
        console.log('bad pixel... -- x:', x, '-- y:', y)
        // TODO: This is currently happening because of the margin...
      }
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
