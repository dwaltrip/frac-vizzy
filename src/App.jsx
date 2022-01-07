import React, { useState } from 'react';

import './App.css';

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


function App() {
  const [xRange, setXRange] = useState(initialXRange);
  const [yRange, setYRange] = useState(initialYRange);

  return (
    <div className="App">
      <MandelbrotPlot
        xRange={xRange}
        yRange={yRange}
        updatePlot={(newXRange, newYRange) => {
          // console.log('updatePlot',
          //   '-- xRange:', JSON.stringify(newXRange),
          //   '-- yRange:', JSON.stringify(newYRange),
          // );
          // TODO: this may cause 2 renders (2 fn calls)
          setXRange(newXRange);
          setYRange(newYRange);
        }}
      />
    </div>
  );
}

export default App;
