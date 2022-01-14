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
  console.log('-- url query params data:', data);
  return {
    xRange: initialXRange,
    yRange: initialYRange,
  };
}

function App() {
  const [configs, setConfigs] = useState(getInitialConfigs());

  return (
    <div className='App'>
      {/* TODO: use React state for Config Panel field values */}
      <ConfigPanel configs={configs} />

      <MandelbrotPlot
        // configs={configs}
        xRange={configs.xRange}
        yRange={configs.yRange}
        updateConfigs={(newXRange, newYRange) => {
          console.log('new xRange:', JSON.stringify(newXRange))
          console.log('new yRange:', JSON.stringify(newYRange));
          // setConfigs(newYRange);
        }}
      />
    </div>
  );
}

export default App;
