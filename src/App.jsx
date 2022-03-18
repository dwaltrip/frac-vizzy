import React, { useState, useEffect } from 'react';
import qs from 'qs';

import './styles/App.css';

import { DEFAULT_VIEWPORT } from './settings';
import { getInitialParams, serializeParams, normalizeParams } from './plotParams';

import { SettingsPanel } from './SettingsPanel';
import { MandelbrotPlot } from './MandelbrotPlot';

let initialLoad = true;

function App() {
  console.log('=== Rendering App... ==='); 
  const [plotParams, setParamsRaw] = useState(getInitialParams(DEFAULT_VIEWPORT));

  function setPlotParams({ ...newParams }) {
    setParamsRaw(prevParams => normalizeParams(
      { ...prevParams, ...newParams },
      DEFAULT_VIEWPORT,
    ));
  }

  useEffect(() => {
    // TODO: better way of doing this?
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

  return (
    <div className='App'>
      <SettingsPanel
        params={plotParams}
        setPlotParams={setPlotParams}
      />

      <MandelbrotPlot
        params={plotParams}
        setPlotParams={setPlotParams}
      />
    </div>
  );
}

export default App;
