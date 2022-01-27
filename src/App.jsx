import React, { useState, useEffect } from 'react';
import qs from 'qs';

import './styles/App.css';

import { SettingsPanel } from './SettingsPanel';
import { MandelbrotPlot } from './MandelbrotPlot';

const DEFAULT_PARAMS = {
  realRange: { start: "-1.5", end: "0.5" },
  complexRange: { start: "-1.2", end: "1.2" },
  iterationLimit: "250",
};

function parseRange(range) {
  if (!range) {
    return null;
  }
  return { start: parseFloat(range.start), end: parseFloat(range.end) };
}

function getInitialParams() {
  const url = new URL(window.location.href);
  const data = qs.parse(url.searchParams.toString());
  const defaults = DEFAULT_PARAMS;
  // TODO: Better error handling here.
  // We need to handle any possible user input for the URL param values.
  return {
    realRange: parseRange({ ...defaults.realRange, ...data.realRange }),
    complexRange: parseRange({ ...defaults.complexRange, ...data.complexRange }),
    iterationLimit: parseInt(data.iterationLimit || defaults.iterationLimit),
  };
}

let initialLoad = true;

function App() {
  console.log('=== Rendering App... ==='); 
  const [plotParams, setParamsRaw] = useState(getInitialParams());

  function setPlotParams({ ...newParams }) {
    setParamsRaw(prevParams => ({
      ...prevParams,
      ...newParams,
    }));
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
      qs.stringify(plotParams, { encode: false })
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
