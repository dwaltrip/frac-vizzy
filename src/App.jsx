import './App.css';

import { MandelbrotPlot } from './MandelbrotPlot';

function App() {
  return (
    <div className="App">
      <MandelbrotPlot
        xRange={{ start: -2, end: 2 }}
        yRange={{ start: -2, end: 2 }}
      />
    </div>
  );
}

export default App;
