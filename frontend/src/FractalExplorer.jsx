import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import qs from 'qs';

import './styles/FractalExplorer.css';

import { request } from './api';

import { getInitialParams, serializeParams, normalizeParams } from './plotParams';
import { getInitialSystemParams, saveSystemParams } from './systemParams';
import { getViewportInfo } from './viewport';
import { getInitialZoomLevel } from './mandelbrot/calcs';

import { selectCurrentUser } from './features/users/usersSlice';

import { SettingsPanel } from './SettingsPanel';
import { MandelbrotPlot } from './MandelbrotPlot';

function createSnapshot(description, imageData, user) {
  const link = window.location.href;

  // TODO: send the image as binary data? for better perf?
  return request.post('snapshots', {
    description,
    link,
    author: user.id,
    image_data: imageData,
    region_info: {},
  });
}

let userHasChangedParams = false;

function FractalExplorer() {
  const canvasRef = useRef();
  console.log('=== Rendering App... ==='); 

  const [viewportRect, setViewportRect] = useState(null);
  const [plotParams, setParamsRaw] = useState(getInitialParams());
  const [systemParams, setSystemParamsRaw] = useState(getInitialSystemParams());

  const currentUser = useSelector(selectCurrentUser);

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
    window.history.replaceState(null, '', relPathWithQuery);
  }, [plotParams]);

  useEffect(() => saveSystemParams(systemParams), [systemParams]);

  return (
    <>
      {/* TODO: setting panel should be a child of the plot container */}
      <SettingsPanel
        params={plotParams}
        setPlotParams={setPlotParams}
        systemParams={systemParams}
        setSystemParams={setSystemParams}
        createSnapshot={desc => {
          const canvas = canvasRef.current;
          const imageData = canvas.toDataURL();
          return createSnapshot(desc, imageData, currentUser);
        }}
      />

      <MandelbrotPlot
        params={plotParams}
        setPlotParams={setPlotParams}
        systemParams={systemParams}
        viewportRect={viewportRect}
        setViewportRect={setViewportRect}
        setCanvasRef={canvas => { canvasRef.current = canvas; }}
      />
    </>
  );
}

export { FractalExplorer };
