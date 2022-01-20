import React, { useState, useEffect } from 'react';
import qs from 'qs';

import './styles/App.css';

import { ConfigPanel } from './ConfigPanel';
import { MandelbrotPlot } from './MandelbrotPlot';

const DEFAULT_CONFIGS = {
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

function getInitialConfigs() {
  const url = new URL(window.location.href);
  const data = qs.parse(url.searchParams.toString());
  const defaults = DEFAULT_CONFIGS;
  // TODO: Better error handling here.
  // We need to handle any possible user input for the URL param values.
  const configs = {
    realRange: parseRange({ ...defaults.realRange, ...data.realRange }),
    complexRange: parseRange({ ...defaults.complexRange, ...data.complexRange }),
    iterationLimit: parseInt(data.iterationLimit || defaults.iterationLimit),
  };
  return configs;
}

let initialLoad = true;

function App() {
  console.log('=== Rendering App... ==='); 
  const [configs, setConfigsRaw] = useState(getInitialConfigs());

  function setConfigs({ realRange, complexRange }) {
    console.log('setConfigs...');
    setConfigsRaw(prevConfigs => ({
      ...prevConfigs,
      realRange: realRange,
      complexRange: complexRange,
    }));
  }

  useEffect(() => {
    // TODO: better way of doing this?
    if (initialLoad) {
      initialLoad = false;
      return;
    }
    const relPathWithParams = (
      window.location.pathname + '?' +
      qs.stringify(configs, { encode: false })
    );
    window.history.replaceState(null, '', relPathWithParams);
  }, [configs]);

  return (
    <div className='App'>
      <ConfigPanel
        configs={configs}
        setConfigs={setConfigs}
      />

      <MandelbrotPlot
        configs={configs}
        setConfigs={setConfigs}
      />
    </div>
  );
}

export default App;
