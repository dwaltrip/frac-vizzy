import React, { useEffect, useRef, useState } from 'react';

import './styles/App2.css';

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
  { size: MARGIN, color: { r: 240, g: 230, b: 200 } },
);

function App() {
  const canvasRef = useRef();
  const [topLeft, setTopLeft] = useState({ x: 0, y: 0 });

  function updateTile() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imageData = drawTile(
      RAW_DATA,
      ctx,
      { height: canvas.height, width: canvas.width },
      topLeft,
    );
    ctx.putImageData(imageData, 0, 0);
  }

  useEffect(() => {
    // console.log('-- useEffect -- canvasRef');
    updateTile();
  }, [canvasRef]);

  useEffect(() => {
    // console.log('-- useEffect -- topLeft');
    updateTile();
  }, [topLeft]);

  const onPan = panVector => {
    // console.log("--- on pan ---")
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

    const newTopLeft = {
      x: topLeft.x + (xRatio * canvas.width),
      y: topLeft.y + (yRatio * canvas.height),
    };
    // console.log('newTopLeft:', JSON.stringify(newTopLeft));
    setTopLeft(newTopLeft);
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

  // console.log('=== viewport:', viewport)
  // console.log('=== tile dims -- height:', tileHeight, '-- width:', tileWidth);
  // console.log('=== topLeft:', JSON.stringify(topLeft))

  for (let y=0; y<viewport.width; y++) {
    if (topLeft.y + y > viewport.height) {
      break;
    }

    const row = tile[y];

    for (let x=0; x < viewport.width; x++) {
      if (topLeft.x + x > viewport.width) {
        break;
      }

      const pixel = row[x];
      drawPixel(
        imageData,
        topLeft.x + x,
        topLeft.y + y,
        pixel.r,
        pixel.g,
        pixel.b,
      );
    }
  }

  return imageData;
}

function createGradientTile(color1, color2, size, marginInfo) {
  const { height, width } = size;
  // console.log('createGradientTile -- height:', height, '-- width:', width)
  const tile = [];

  const hasMargin = !!marginInfo;
  let marginSize = hasMargin ? marginInfo.size : 0;

  const tileHeight = height + (marginSize * 2);
  const tileWidth = width + (marginSize * 2);

  function addVertMargins() {
    for (let i=0; i<marginSize; i++) {
      const marginRow = [];
      for (let x=0; x<tileWidth; x++) {
        marginRow.push(marginInfo.color);
      }
      tile.push(marginRow);
    }
  }

  // top margin
  if (hasMargin) {
    addVertMargins();
  }

  for (let y=0; y < height ; y++) {
    const row = [];

    function addHorizMargins() {
      for (let i=0; i<marginSize; i++) {
        row.push(marginInfo.color);
      }
    }

    // left margin
    if (hasMargin) {
      addHorizMargins()
    }

    for (let x=0; x < width; x++) {
      const percent = (x + y) / (width + height);
      row.push({
        r: percentToRangeVal(percent, color1.r, color2.r),
        g: percentToRangeVal(percent, color1.g, color2.g),
        b: percentToRangeVal(percent, color1.b, color2.b),
      });
    }

    // right margin
    if (hasMargin) {
      addHorizMargins()
    }

    tile.push(row);
  }

  // bottom margin
  if (hasMargin) {
    addVertMargins();
  }

  // console.log('createGradientTile -- tile dims -- height:', tile.length, ', width:', tile[0].length);

  return tile;
}

function percentToRangeVal(percent, start, end) {
  return Math.floor(start + (percent * (end - start)));
}

// ----------------------------------------------------------------------------

export default App;
