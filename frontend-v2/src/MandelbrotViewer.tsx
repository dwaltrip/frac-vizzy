import { useEffect, useRef } from 'react';
import { Mandelbrot } from '@/mandelbrot/mandelbrot';

function MandelbrotViewer(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      return;
    }

    const numWorkers = 4;
    const mandelbrot = new Mandelbrot(
      containerRef.current,
      canvasRef.current,
      numWorkers,
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
