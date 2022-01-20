import './styles/ConfigPanel.css';

import { round } from './lib/round';
import { SelectWithCustomValues } from './ui/SelectWithCustomValues';

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
function ConfigPanel({ configs, setConfigs }) {
  const {
    realRange,
    complexRange,
    iterationLimit,
  } = configs;

  const setIterationLimit = value => {
    setConfigs({ iterationLimit: parseInt(value) });
  };

  return (
    <div className='config-panel'>
      <header>Settings</header>

      <section className='data-section coords-display'>
        <div className='data-header'>Coordinates</div>

        <div className='data-subheader'>Real Range</div>
        <div className='data-row'>
          <label>Start</label>
          <span className='value'>{round(realRange.start, 5)}</span>
        </div>
        <div className='data-row'>
          <label>End</label>
          <span className='value'>{round(realRange.end, 5)}</span>
        </div>

        <div className='data-subheader'>Complex Range</div>
        <div className='data-row'>
          <label>Start</label>
          <span className='value'>{round(complexRange.start, 5)}</span>
        </div>
        <div className='data-row'>
          <label>End</label>
          <span className='value'>{round(complexRange.end, 5)}</span>
        </div>
      </section>

      <section className='data-section'>
        <div className='data-header'>Other Configs</div>
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
    </div>
  );
}

export { ConfigPanel };
