import React, { useState } from 'react';
import qs from 'qs';

import './styles/App.css';

import { ConfigPanel } from './ConfigPanel';
import { MandelbrotPlot } from './MandelbrotPlot';


// const initialXRange = { start: -2, end: 2 };
// const initialYRange = { start: -2, end: 2 };

const initialXRange = { start: -1.5, end: 0.5 };
const initialYRange = { start: -1.2, end: 1.2 };

// -----------

// const initialXRange = { start: -0.8, end: -0.7 };
// const initialYRange = { start: 0.1, end: 0.2 };

// const initialXRange = { start: -0.75, end: -0.73 };
// const initialYRange = { start: 0.175, end: 0.2 };

function getInitialConfigs() {
  const url = new URL(window.location.href);
  const data = qs.parse(url.searchParams.toString());
  // console.log('-- url query params data:', data);
  return {
    realRange: initialXRange,
    complexRange: initialYRange,
  };
}

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
