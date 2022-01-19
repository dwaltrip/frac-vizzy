import './styles/ConfigPanel.css';

import { round } from './lib/round';

function ConfigPanel({ configs }) {
  const {
    realRange,
    complexRange,
    iterationLimit,
  } = configs;

  return (
    <div className='config-panel'>
      <header>Config Panel</header>

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
          <span className='value'>{iterationLimit}</span>
        </div>
      </section>
    </div>
  );
}

export { ConfigPanel };
