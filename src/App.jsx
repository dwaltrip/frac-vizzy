import React, { useState, useEffect } from 'react';
import qs from 'qs';

import './styles/App.css';

import { DEFAULT_VIEWPORT } from './settings';
import { getInitialParams, serializeParams, normalizeParams } from './plotParams';
import { getInitialSystemParams, saveSystemParams } from './systemParams';

import { SettingsPanel } from './SettingsPanel';
import { MandelbrotPlot } from './MandelbrotPlot';

let initialLoad = true;

function App() {
  console.log('=== Rendering App... ==='); 
  const [plotParams, setParamsRaw] = useState(getInitialParams(DEFAULT_VIEWPORT));
  const [systemParams, setSystemParamsRaw] = useState(getInitialSystemParams());

  function setPlotParams({ ...newParams }) {
    setParamsRaw(prevParams => normalizeParams(
      { ...prevParams, ...newParams },
      DEFAULT_VIEWPORT,
    ));
  }

  function setSystemParams({ ...newParams }) {
    setSystemParamsRaw(prevParams => ({ ...prevParams, ...newParams }));
  }

  useEffect(() => {
    // We don't run this on initial load so that we don't show the plot params
    //   in the URL if they are viewing the default plot.
    if (initialLoad) {
      initialLoad = false;
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
      />
    </div>
  );
}

export default App;
