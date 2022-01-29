import './styles/SettingsPanel.css';

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
function SettingsPanel({ params, setPlotParams }) {
  const {
    realRange,
    complexRange,
    iterationLimit,
  } = params;

  const setIterationLimit = value => {
    setPlotParams({ iterationLimit: parseInt(value) });
  };

  return (
    <div className='settings-panel'>
      <header>Settings</header>

      <section className='data-section coords-display'>
        <div className='data-header'>Coordinates</div>

        <div className='data-subheader'>Real Range</div>
        <div className='data-row'>
          <label>Start</label>
          <span className='value'>{realRange.start}</span>
        </div>
        <div className='data-row'>
          <label>End</label>
          <span className='value'>{realRange.end}</span>
        </div>

        <div className='data-subheader'>Complex Range</div>
        <div className='data-row'>
          <label>Start</label>
          <span className='value'>{complexRange.start}</span>
        </div>
        <div className='data-row'>
          <label>End</label>
          <span className='value'>{complexRange.end}</span>
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
    </div>
  );
}

export { SettingsPanel };