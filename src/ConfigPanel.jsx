import './styles/ConfigPanel.css';

import { round } from './lib/round';

function ConfigPanel({ configs }) {
  const {
    xRange,
    yRange,
  } = configs;

  return (
    <div className='config-panel'>
      <header>Config Panel</header>

      <section className='data-section coords-display'>
        <div className='data-header'>Coordinates</div>

        <div className='data-subheader'>Real Range</div>
        <div className='data-row'>
          <label>Start</label>
          <span className='value'>{round(xRange.start, 5)}</span>
          <span className='spacer' />
          <label>End</label>
          <span className='value'>{round(xRange.end, 5)}</span>
        </div>

        <div className='data-subheader'>Complex Range</div>
        <div className='data-row'>
          <label>Start</label>
          <span className='value'>{round(yRange.start, 5)}</span>
          <span className='spacer' />
          <label>End</label>
          <span className='value'>{round(yRange.end, 5)}</span>
        </div>
      </section>
    </div>
  );
}

export { ConfigPanel };
