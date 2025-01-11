import { useEffect, useRef, useState } from 'react';
import qs from 'qs';

import { Mandelbrot } from '@/mandelbrot';
import {
  RenderParamsData,
  RenderParamsUpdate,
  serializeParamsForUrl,
  getInitialParams,
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

    const handleNewParams = (params: RenderParamsData) => {
      // If the URL doesn't have any params, don't add them until the user makes
      // a change. This prevents the URL from being cluttered when the user opens
      // the app for the first time and hasn't yet zoomed in on anything.
      // if (!userHasChangedParams) {
      //   return;
      // }
      const relPathWithQuery =
        window.location.pathname +
        '?' +
        qs.stringify(serializeParamsForUrl(params), { encode: false });
      window.history.replaceState(null, '', relPathWithQuery);
      // console.log('New params:', JSON.stringify(params));
    };

    // TODO: this is brittle to React ref changes, as this only runs on mount.
    const mandelbrot = new Mandelbrot(
      containerRef.current,
      canvasRef.current,
      NUM_WORKERS,
      handleNewParams,
    );
    mandelbrot.setup(getInitialParams());
    mandelbrotRef.current = mandelbrot;
    setParams(mandelbrot.getCurrentParams());

    return () => mandelbrot.cleanup();
  }, []);

  useEffect(() => {
    // ---------------------------------------------------------------------------
    // ---------------------------------------------------------------------------
    // TODO: this commented out part is copied from the old v1 code.
    // I wanna do something like this.
    // ---------------------------------------------------------------------------
    // If the URL doesn't have any params, don't add them until the user makes
    // a change. This prevents the URL from being cluttered when the user opens
    // the app for the first time and hasn't yet zoomed in on anything.
    // if (!userHasChangedParams) {
    //   return;
    // }
    // ---------------------------------------------------------------------------
    // ---------------------------------------------------------------------------
    if (!params) {
      console.log('--- No params to serialize ---');
      return;
    }
    const relPathWithQuery =
      window.location.pathname +
      '?' +
      qs.stringify(serializeParamsForUrl(params), { encode: false });
    window.history.replaceState(null, '', relPathWithQuery);
  }, [params]);

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
