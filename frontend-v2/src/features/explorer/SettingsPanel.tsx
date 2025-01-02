import { JSX } from 'react';
import { useState } from 'react';
import { ColorPicker } from '@/ui/ColorPicker';

import '@/styles/features/explorer/settings-panel.css';
import classnames from 'classnames';
import {
  FrozenRenderParams,
  RenderParamsUpdate,
  ColoringAlgorithm,
} from '@/mandelbrot/params/render-params';
import { Color } from '@/mandelbrot/types';

const ITERATION_VALUE_OPTS = [100, 250, 500, 1000, 2500, 5000].map((num) => {
  const value = '' + num;
  return { value, text: value };
});

// ----------------------------------------------------------------------
// TODO: These are placeholders for now, need to implement the real thing
// Also need to figure out where to put this
const COLOR_ALGORITHM_OPTS = [
  { value: 'linear', text: 'Linear' },
  { value: 'histogram', text: 'Histogram' },
];
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// TODO: Need to add some sort of affordance so the user realizes how to
// access the settings panel. Right now it's pretty "hidden" / non-discoverable
// ----------------------------------------------------------------------

function SettingsPanel({
  params,
  updateParams,
}: {
  params: FrozenRenderParams | null;
  updateParams: (params: RenderParamsUpdate) => void;
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
    <SlideOutPanel>
      {/* TODO: decide if I want to use this or not */}
      {/* {({ isOpen, setIsOpen }) => ( */}
      {() => (
        <div className='settings-panel'>
          <div className='settings-panel-header'>Frac Vizzy</div>
          <div className='settings-rows-container'>
            <SettingsRow label='Iterations'>
              <select
                className='settings-select'
                value={iters}
                onChange={setIters}
              >
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
                onChange={(e) =>
                  setColorAlgo(e.target.value as ColoringAlgorithm)
                }
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
      )}
    </SlideOutPanel>
  );
}

function SlideOutPanel({
  children,
}: {
  children: (...args: any[]) => JSX.Element;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={classnames('slide-out-panel-container', isOpen && 'visible')}
    >
      <div className='slide-out-panel' onMouseLeave={() => setIsOpen(false)}>
        {children({ isOpen, setIsOpen })}
      </div>
      <div
        className='slide-out-panel-opener'
        onMouseEnter={() => setIsOpen(true)}
      ></div>
    </div>
  );
}

export { SettingsPanel };
