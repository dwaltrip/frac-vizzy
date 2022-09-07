import './styles/SettingsPanel.css';

import { TILE_SIDE_LENGTH_IN_PIXELS, COLOR_METHOD_OPTS } from './settings';
import { SelectWithCustomValues } from './ui/SelectWithCustomValues';
import { truncateRange } from './lib/truncateRange';

import { ColorPicker } from './ui/ColorPicker';

const ITERATION_VALUE_OPTS = [
  100,
  250,
  500,
  1000,
  2500,
  5000,
].map(num => {
  const value = '' + num;
  return { value, text: value };
});

function SettingsPanel({ params, setPlotParams, systemParams, setSystemParams }) {
  const { centerPos, zoomLevel, iterationLimit, colorMethod } = params;
  const { numWorkers, maxNumWorkers } = systemParams;

  const [color1, color2] = params.colorGradient;
  const setColor1 = val => setPlotParams({ colorGradient: [val, color2] });
  const setColor2 = val => setPlotParams({ colorGradient: [color1, val] });

  const setIterationLimit = value => {
    setPlotParams({ iterationLimit: parseInt(value) });
  };

  const setColorMethod = event => {
    setPlotParams({ colorMethod: event.target.value });
  };

  const setNumWorkers = event => {
    setSystemParams({ numWorkers: parseInt(event.target.value) });
  };

  // TODO: Work on improving the info heirarchy.
  return (
    <div className='settings-panel'>
      {/* TODO: maybe move to App.jsx? */}
      <header className='app-name'>Frac Vizzy</header>

      <header className='primary'>Plot Settings</header>

      <section className='data-section coords-display'>
        {/* TODO: better name for this... */}
        <div className='data-header'>View Area</div>

        <div className='data-subheader'>Center Point</div>
        <div className='data-row'>
          <label>Real</label>
          <span className='value'>{centerPos.r}</span>
        </div>
        <div className='data-row'>
          <label>Imaginary</label>
          <span className='value'>{centerPos.c}</span>
        </div>

        {/* TODO: Zoom should be a sibling to Center Point, not a child */}
        <div className='data-row'>
          <label>Zoom</label>
          <span className='value'>{zoomLevel}</span>
        </div>
      </section>

      <section className='data-section'>
        <div className='data-header'>Other Settings</div>
        <div className='data-row'>
          <label>Iterations</label>
          <span className='value'>
            <SelectWithCustomValues
              value={'' + iterationLimit}
              options={ITERATION_VALUE_OPTS}
              onChange={setIterationLimit}
            />
          </span>
        </div>
      </section>

      <section className='data-section'>
        <div className='data-header'>Colors</div>

        <div className='data-row color-picker-row'>
          <label>Gradient</label>

          <ColorPicker color={color1} onChange={setColor1} />

          <ColorPicker color={color2} onChange={setColor2} />
        </div>

        <div className='data-row'>
          <label>Method</label>
          <select
            className='settings-select'
            value={colorMethod}
            onChange={setColorMethod}
          >
            {COLOR_METHOD_OPTS.map(method => (
              <option value={method.value} key={method.value}>
                {method.text}
              </option>
            ))}
          </select>
        </div>
      </section>


      <header className='primary'>System Settings</header>

      <section className='data-section'>
        <div className='data-row'>
          <label>Number of Workers</label>
          <select
            className='settings-select'
            value={numWorkers}
            onChange={setNumWorkers}
          >
            {range(maxNumWorkers).map(num => (
              <option value={num} key={num}>{num}</option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}

function range(n) {
  return Array.from(new Array(n)).map((_, i) => i+1);
}

export { SettingsPanel };
