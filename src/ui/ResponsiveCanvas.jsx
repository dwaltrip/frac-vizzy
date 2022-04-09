import React, { forwardRef, useEffect, useRef, useState } from 'react';

import './ResponsiveCanvas.css';
import { throttle } from '../lib/throttle';
import { useNonStaleFunction } from '../lib/useNonStaleFunction';

const ResponsiveCanvas = forwardRef(({ onResize: _onResize, className, ...props }, ref) => {
  const containerRef = useRef(null);
  const canvasRef = ref;

  // This prevents the `resize` event listener from using a stale value for
  //   the `onResize` prop. The handler for the `resize` is set once on the
  //   first render, so it would otherwise have a stale ref for `onResize`.
  const onResize = useNonStaleFunction(_onResize);

  const resizeCanvas = throttle(() => {
    const canvas = canvasRef.current;
    const containerRect = containerRef.current.getBoundingClientRect();

    canvas.height = Math.floor(containerRect.height);
    canvas.width = Math.floor(containerRect.width);
    onResize && onResize(canvas);
  }, 100);

  // Resize the canvas once in the beginning when the page renders and we find
  // out the size of the container.
  useEffect(() => {
    resizeCanvas();
  }, []);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);


  return (
    <div className='responsive-canvas-container' ref={containerRef}>
      <canvas
        className={`responsive-canvas ${className || ''}`}
        ref={canvasRef}
        {...props}
      >
      </canvas>
    </div>
  );
});

export { ResponsiveCanvas };
