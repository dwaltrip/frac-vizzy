import { useEffect, useRef, useState } from 'react';
import qs from 'qs';

import { Mandelbrot } from '@/mandelbrot';
import {
  RenderParamsData,
  RenderParamsUpdate,
  serializeParamsForUrl,
} from '@/mandelbrot/params/render-params';
import {
  UserSettings,
  UserSettingsUpdate,
} from '@/mandelbrot/params/user-settings';

import { SettingsPanel } from '@/features/explorer/SettingsPanel';
import '@/styles/features/explorer/explorer.css';

function Explorer(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mandelbrotRef = useRef<Mandelbrot | null>(null);

  const [params, setParams] = useState<RenderParamsData | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  console.log('-------- Explorer component --------');

  // TODO: Look into potentially doing clenanup of the Mandelbrot instance
  // if the component is unmounted. Right now that doesn't happen.
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      return;
    }

    function handleNewParams(params: RenderParamsData, isDefault: boolean) {
      const mandelbrot = mandelbrotRef.current;
      if (mandelbrot) {
        setParams(mandelbrot.getCurrentParams());
      }

      // If the URL doesn't have any params, don't add them until the user makes
      // a change. This prevents the URL from being cluttered when the user opens
      // the app for the first time and hasn't yet zoomed in on anything.
      if (!isDefault) {
        const relPathWithQuery =
          window.location.pathname +
          '?' +
          qs.stringify(serializeParamsForUrl(params), { encode: false });
        window.history.replaceState(null, '', relPathWithQuery);
      }
    }

    function handleNewUserSettings(userSettings: UserSettings) {
      console.log('handleNewUserSettings', userSettings);
      setUserSettings(userSettings);
    }

    const mandelbrot = new Mandelbrot(
      containerRef.current,
      canvasRef.current,
      handleNewParams,
      handleNewUserSettings,
    );
    mandelbrotRef.current = mandelbrot;
    setParams(mandelbrot.getCurrentParams());

    return () => mandelbrot.cleanup();
  }, []);

  return (
    <div className='page explorer-page'>
      <SettingsPanel
        params={params}
        userSettings={userSettings}
        updateParams={(changes: RenderParamsUpdate) => {
          const mb = mandelbrotRef.current;
          if (!mb) {
            throw new Error('Mandelbrot instance not available');
          }
          mb.updateParams(changes);
        }}
        updateUserSettings={(changes: UserSettingsUpdate) => {
          const mb = mandelbrotRef.current;
          if (!mb) {
            throw new Error('Mandelbrot instance not available');
          }
          mb.updateUserSettings(changes);
        }}
      />
      <div className='mb-canvas-container' ref={containerRef}>
        <canvas className='mb-canvas' ref={canvasRef} />
      </div>
    </div>
  );
}

export { Explorer };
