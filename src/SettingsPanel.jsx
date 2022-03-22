import './styles/SettingsPanel.css';

import { TILE_SIDE_LENGTH_IN_PIXELS, COLOR_METHOD_OPTS } from './settings';
import { SelectWithCustomValues } from './ui/SelectWithCustomValues';
import { truncateRange } from './lib/truncateRange';

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

// TODO: Enable modifying the settings while points are being computed.
function SettingsPanel({ params, setPlotParams }) {
  const { centerPos, zoomLevel, iterationLimit, colorMethod } = params;

  const setIterationLimit = value => {
    setPlotParams({ iterationLimit: parseInt(value) });
  };

  const setColorMethod = event => {
    console.log(event.target.value)
    setPlotParams({ colorMethod: event.target.value });
  };

  return (
    <div className='settings-panel'>
      <header>Settings</header>

      <section className='data-section coords-display'>
        {/* TODO: better name for this... */}
        <div className='data-header'>View Area</div>

        <div className='data-subheader'>Center Point</div>
        <div className='data-row'>
          <label>Real</label>
          <span className='value'>{centerPos.r}</span>
        </div>
        <div className='data-row'>
          <label>Complex</label>
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
        <div className='data-row'>
          <label>Method</label>
          {/* TODO: clean up the classnames and stuff.
              E.g. It should be generic, somethign like "settings-panel-select" */}
          <select
            className='color-method-select'
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
    </div>
  );
}

export { SettingsPanel };
