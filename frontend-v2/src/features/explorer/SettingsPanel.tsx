import { JSX } from 'react';
import { useState } from 'react';
import { ColorPicker } from '@/ui/ColorPicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faXmark } from '@fortawesome/free-solid-svg-icons';

import '@/styles/features/explorer/settings-panel.css';
import classnames from 'classnames';
import {
  FrozenRenderParams,
  RenderParamsUpdate,
  ColoringAlgorithm,
} from '@/mandelbrot/params/render-params';
import { Color } from '@/mandelbrot/types';

// TODO: should these be somewhere else?
const ITERATION_VALUE_OPTS = [100, 250, 500, 1000, 2500, 5000].map((num) => {
  const value = '' + num;
  return { value, text: value };
});
const COLOR_ALGORITHM_OPTS = [
  { value: 'linear', text: 'Linear' },
  { value: 'histogram', text: 'Histogram' },
];

function SettingsRow({
  label,
  children,
}: {
  label: string;
  children: JSX.Element | JSX.Element[];
}) {
  return (
    <div className='settings-row'>
      <label>{label}</label>
      <div className='content'>{children}</div>
    </div>
  );
}

function SettingsPanelContent({
  params,
  updateParams,
  setIsOpen,
}: {
  params: FrozenRenderParams | null;
  updateParams: (params: RenderParamsUpdate) => void;
  setIsOpen: (isOpen: boolean) => void;
}) {
  // ---------------------------------------------------------------
  // TODO: these are placeholders for now so the code can run
  // Will implement the actual functionality later
  const [numCPUs, setNumCPUs] = useState(2);
  // ---------------------------------------------------------------

  const setIters = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value, 10);
    updateParams({ type: 'iters', value });
  };
  const setColor1 = (color: Color.RGB) => {
    updateParams({ type: 'colors', value: { color1: color } });
  };
  const setColor2 = (color: Color.RGB) => {
    updateParams({ type: 'colors', value: { color2: color } });
  };
  const setColorAlgo = (algo: ColoringAlgorithm) => {
    updateParams({ type: 'colors', value: { algorithm: algo } });
  };

  if (!params) {
    return null;
  }
  const {
    iters,
    colors: { color1, color2, algorithm },
  } = params;

  return (
    <div className='settings-panel'>
      <div className='header'>
        Frac Vizzy
        <button
          className='close-button'
          onClick={() => setIsOpen(false)}
          aria-label='Close settings'
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <div className='rows-container'>
        <SettingsRow label='Iterations'>
          <select className='settings-select' value={iters} onChange={setIters}>
            {ITERATION_VALUE_OPTS.map(({ value, text }) => (
              <option value={value} key={value}>
                {text}
              </option>
            ))}
          </select>
        </SettingsRow>

        <SettingsRow label='Colors'>
          <ColorPicker color={color1} onChange={setColor1} />
          <ColorPicker color={color2} onChange={setColor2} />
        </SettingsRow>

        {/* TODO: Decide if "Visualization Style" is the best label, UX-wise */}
        <SettingsRow label='Visualization Style'>
          <select
            className='settings-select'
            value={algorithm}
            onChange={(e) => setColorAlgo(e.target.value as ColoringAlgorithm)}
          >
            {COLOR_ALGORITHM_OPTS.map(({ value, text }) => (
              <option value={value} key={value}>
                {text}
              </option>
            ))}
          </select>
        </SettingsRow>

        {/* TODO: This a different type of setting, compared to others.
            Should be displayed separately? Or somehow differentiated in the UI. */}
        <SettingsRow label='CPUs'>
          <select
            className='settings-select'
            value={numCPUs}
            onChange={(e) => setNumCPUs(parseInt(e.target.value, 10))}
          >
            {/* TODO: placeholder values, implement for real */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </SettingsRow>
      </div>
    </div>
  );
}

function SettingsPanel({
  params,
  updateParams,
}: {
  params: FrozenRenderParams | null;
  updateParams: (params: RenderParamsUpdate) => void;
}) {
  // TODO: inital value should be pulled from user's saved preferences
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className='settings-wrap'>
      <div
        className={classnames(
          'settings-panel-container',
          isOpen ? 'is-visible' : 'is-hidden',
        )}
      >
        <SettingsPanelContent
          params={params}
          updateParams={updateParams}
          setIsOpen={setIsOpen}
        />
      </div>

      <button
        className='panel-opener'
        onClick={() => setIsOpen(true)}
        aria-label='Open settings'
      >
        <FontAwesomeIcon icon={faGear} />
      </button>
    </div>
  );
}

export { SettingsPanel };
