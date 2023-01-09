import React from 'react';
import { useSelector } from 'react-redux';

import 'styles/SettingsPanel.css';

import { TILE_SIDE_LENGTH_IN_PIXELS, COLOR_METHOD_OPTS } from 'settings';
import { SelectWithCustomValues } from 'ui/SelectWithCustomValues';
import { truncateRange } from 'lib/truncateRange';

import { selectCurrentUser } from 'features/users/usersSlice';

import { ColorPicker } from 'ui/ColorPicker';

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

function SettingsPanel({
  params,
  setPlotParams,
  systemParams,
  setSystemParams,
  createSnapshot,
}) {
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

  const currentUser = useSelector(selectCurrentUser);

  // TODO: Work on improving the info heirarchy.
  return (
    <div className='settings-panel'>
      {/* TODO: maybe move to App.jsx? */}
      <header className='app-name'>Frac Vizzy</header>

      <header className='primary'>Plot Settings</header>

      <section className='data-section'>
        <div className='data-header'>Computation</div>
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
        <div className='data-header'>Coloring</div>

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

      <header className='primary'>Plot Metrics</header>

      <section className='data-section coords-display'>
        <div className='data-header'>Position</div>
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

      <header className='primary'>Controls</header>

      <section className='data-section guide-for-controls'>
        <div className='data-row'>
          <label>
            <span className='ui-action'>Double-click</span>{" "}
            to zoom in.
          </label>
        </div>
        <div className='data-row'>
          <label>
            <span className='ui-action'>Right-click</span>{" "}
            to zoom out.
          </label>
        </div>
        <div className='data-row'>
          <label>
            <span className='ui-action'>Drag</span>{" "}
            to move side to side.
          </label>
        </div>
      </section>

      {currentUser &&
        <section>
          <button
            onClick={() => {
              const desc = window.prompt('Snapshot description:');
              createSnapshot(desc).then(res => {
                console.log('createSnapshot.then -- res:', res)
              });
            }}
          >
            Create Snapshot
          </button>
        </section>
      }
    </div>
  );
}

function range(n) {
  return Array.from(new Array(n)).map((_, i) => i+1);
}

export { SettingsPanel };
