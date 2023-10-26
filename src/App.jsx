import React, { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import qs from 'qs';
import debounce from 'lodash.debounce';

import './styles/App.css';

import {
  getInitialParams,
  serializeParams,
  normalizeParams,
  deserializeParams,
  arePositionsDifferent,
} from './plotParams';
import { getInitialSystemParams, saveSystemParams } from './systemParams';
import { getViewportInfo } from './viewport';
import { getInitialZoomLevel } from './mandelbrot/calcs';

import { SettingsPanel } from './SettingsPanel';
import { MandelbrotPlot } from './MandelbrotPlot';


const trackPositionChange = debounce(url => {
  const eventName = 'position-change';
  posthog.capture(eventName, { url });
}, 500);


let userHasChangedParams = false;

function App() {
  console.log('=== Rendering App... ==='); 
  const [viewportRect, setViewportRect] = useState(null);
  const [plotParams, setParamsRaw] = useState(getInitialParams());
  const [systemParams, setSystemParamsRaw] = useState(getInitialSystemParams());

  function setPlotParams({ ...newParams }) {
    // We are relying on the fact that `setPlotParams` currently only gets
    // called when the user takes an action that changes the params.
    // Either via a canvas event or by the settings panel.
    // This is slighlty brittle...
    userHasChangedParams = true;
    const viewport = getViewportInfo(plotParams, viewportRect);
    setParamsRaw(prevParams => normalizeParams(
      { ...prevParams, ...newParams },
      viewport,
    ));
  }

  useEffect(() => {
    const isZoomLevelNotSetAndWeHaveViewportSize = (
      !plotParams.zoomLevel && viewportRect
    );
    if (isZoomLevelNotSetAndWeHaveViewportSize) {
      setParamsRaw(prevParams => ({
        ...prevParams,
        zoomLevel: getInitialZoomLevel(viewportRect),
      }));
    }
  }, [viewportRect]);

  function setSystemParams({ ...newParams }) {
    setSystemParamsRaw(prevParams => ({ ...prevParams, ...newParams }));
  }

  useEffect(() => {
    // If the URL doesn't have any params, don't add them until the user makes
    // a change. This prevents the URL from being cluttered when the user opens
    // the app for the first time and hasn't yet zoomed in on anything.
    if (!userHasChangedParams) {
      return;
    }
    const relPathWithQuery = (
      window.location.pathname + '?' +
      qs.stringify(serializeParams(plotParams), { encode: false })
    );

    // Capture "position change" event
    // This will let us see where in the fractal users are exploring
    const url = new URL(window.location.href);
    const prevParams = deserializeParams(qs.parse(url.searchParams.toString()));
    const currParams = plotParams;
    if (arePositionsDifferent(prevParams, currParams)) {
      trackPositionChange(url.origin + relPathWithQuery);
    }

    window.history.replaceState(null, '', relPathWithQuery);
  }, [plotParams]);

  useEffect(() => saveSystemParams(systemParams), [systemParams]);

  return (
    <div className='App'>
      <SettingsPanel
        params={plotParams}
        setPlotParams={setPlotParams}
        systemParams={systemParams}
        setSystemParams={setSystemParams}
      />

      <MandelbrotPlot
        params={plotParams}
        setPlotParams={setPlotParams}
        systemParams={systemParams}
        viewportRect={viewportRect}
        setViewportRect={setViewportRect}
      />
    </div>
  );
}

export default App;
