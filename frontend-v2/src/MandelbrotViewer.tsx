import { useEffect, useRef } from 'react';
import { CanvasManager } from '@/mandelbrot/canvas-manager';

function MandelbrotViewer(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      return;
    }

    const canvasManager = new CanvasManager(
      containerRef.current,
      canvasRef.current,
    );

    canvasManager.setup();
    return () => canvasManager.cleanup();
  }, []);

  return (
    <div className='mb-view-container' ref={containerRef}>
      <canvas className='mb-canvas' ref={canvasRef} />
    </div>
  );
}

export { MandelbrotViewer };
