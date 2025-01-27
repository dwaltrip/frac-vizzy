import { JSX } from 'react';
import { useState } from 'react';
import classnames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faXmark } from '@fortawesome/free-solid-svg-icons';

import { range } from '@/lib/range';

import { Color } from '@/mandelbrot/types';
import {
  FrozenRenderParams,
  RenderParamsUpdate,
  ColoringAlgorithm,
} from '@/mandelbrot/params/render-params';
import {
  UserSettings,
  UserSettingsUpdate,
  MAX_NUM_CPUS,
} from '@/mandelbrot/params/user-settings';
import { ColorPicker } from '@/ui/ColorPicker';

import '@/styles/features/explorer/settings-panel.css';

// TODO: This should probably be in a file w/ all other default values / params,
// and other similar constants.
const ITERATION_VALUE_OPTS = [100, 250, 500, 1000, 2500, 5000].map((num) => {
  const value = '' + num;
  return { value, text: value };
});
const COLOR_ALGORITHM_OPTS = [
  { value: 'linear', text: 'Linear' },
  { value: 'histogram', text: 'Histogram' },
];

// range 1 to MAX_NUM_CPUS
const NUM_CPU_OPTS = range(1, MAX_NUM_CPUS).map((num) => {
  const value = '' + num;
  return { value, text: value };
});

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

type ParamsUpdater = (changes: RenderParamsUpdate) => void;
type UserSettingsUpdater = (changes: UserSettingsUpdate) => void;

function SettingsPanelContent({
  params,
  userSettings,
  updateUserSettings,
  updateParams,
  setIsOpen,
}: {
  params: FrozenRenderParams | null;
  userSettings: UserSettings | null;
  updateParams: ParamsUpdater;
  updateUserSettings: UserSettingsUpdater;
  setIsOpen: (isOpen: boolean) => void;
}) {
  // update params
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

  // update user settings
  const setNumCPUs = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value, 10);
    updateUserSettings({ type: 'numCPUs', value });
  };
  // HTML checkbox
  const setHideSettingsPanel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.checked;
    updateUserSettings({ type: 'hideSettingsPanel', value });
  };

  if (!params || !userSettings) {
    return null;
  }
  const {
    iters,
    colors: { color1, color2, algorithm },
  } = params;

  const { numCPUs, hideSettingsPanel } = userSettings;

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
            onChange={setNumCPUs}
          >
            {NUM_CPU_OPTS.map(({ value, text }) => (
              <option value={value} key={value}>
                {text}
              </option>
            ))}
          </select>
        </SettingsRow>

        {/* TODO: Finish implementing this feature. Hiding from the UI for now. */}
        {/*
          <SettingsRow label='Hide Settings Panel'>
            <input
              type='checkbox'
              checked={hideSettingsPanel}
              onChange={setHideSettingsPanel}
            />
          </SettingsRow>
        */}
      </div>
    </div>
  );
}

function SettingsPanel({
  params,
  userSettings,
  updateParams,
  updateUserSettings,
}: {
  params: FrozenRenderParams | null;
  userSettings: UserSettings | null;
  updateParams: ParamsUpdater;
  updateUserSettings: UserSettingsUpdater;
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
          userSettings={userSettings}
          updateParams={updateParams}
          updateUserSettings={updateUserSettings}
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
