import React, { useEffect, useRef } from 'react';

function Canvas({ onmount, ...props }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    onmount && onmount({ canvas, ctx });
  }, []);

  return (
    <canvas ref={canvasRef} {...props}>
    </canvas>
  );
}

function MandelbrotPlot() {
  return (
    <div>
      <Canvas
        height="400"
        width="400"
        onmount={({ canvas, ctx })=> {
          ctx.fillStyle = 'green';
          ctx.fillRect(10, 10, 100, 100);
        }}
      />
    </div>
  );
}

export { MandelbrotPlot };
