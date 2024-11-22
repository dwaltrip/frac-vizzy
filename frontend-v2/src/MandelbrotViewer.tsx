import { useEffect, useRef } from 'react';
import { Mandelbrot } from '@/mandelbrot/mandelbrot-v2';

// TOOD: Make this configurable / user setting
// Default to most of the available cores.
const NUM_WORKERS = 8;
// const NUM_WORKERS = 2;

function MandelbrotViewer(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      return;
    }

    // TODO: this is brittle to React ref changes, as this only runs on mount.
    const mandelbrot = new Mandelbrot(
      containerRef.current,
      canvasRef.current,
      NUM_WORKERS,
    );
    mandelbrot.setup();

    return () => mandelbrot.cleanup();
  }, []);

  return (
    <div className='mb-view-container' ref={containerRef}>
      <canvas className='mb-canvas' ref={canvasRef} />
    </div>
  );
}

export { MandelbrotViewer };
