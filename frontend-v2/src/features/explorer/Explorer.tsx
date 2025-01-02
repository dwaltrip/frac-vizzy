import { useEffect, useRef, useState } from 'react';

import { Mandelbrot } from '@/mandelbrot';
import {
  RenderParamsData,
  RenderParamsUpdate,
} from '@/mandelbrot/params/render-params';

import { SettingsPanel } from './SettingsPanel';
import '@/styles/features/explorer/Explorer.css';

// TOOD: Make this configurable / user setting
// Default to most of the available cores.
const NUM_WORKERS = 8;
// const NUM_WORKERS = 2;

function Explorer(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mandelbrotRef = useRef<Mandelbrot | null>(null);

  const [params, setParams] = useState<RenderParamsData | null>(null);

  console.log('-------- Explorer component --------');

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
    mandelbrotRef.current = mandelbrot;
    setParams(mandelbrot.getCurrentParams());

    return () => mandelbrot.cleanup();
  }, []);

  return (
    <div className='page explorer-page'>
      <SettingsPanel
        params={params}
        updateParams={(changes: RenderParamsUpdate) => {
          const mb = mandelbrotRef.current;
          if (!mb) {
            throw new Error('Mandelbrot instance not available');
          }
          mb.updateParams(changes);
          setParams(mb.getCurrentParams());
        }}
      />
      <div className='mb-canvas-container' ref={containerRef}>
        <canvas className='mb-canvas' ref={canvasRef} />
      </div>
    </div>
  );
}

export { Explorer };
