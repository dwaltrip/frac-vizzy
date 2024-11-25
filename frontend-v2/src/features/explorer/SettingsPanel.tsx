import { JSX } from 'react';
import { useState } from 'react';
import { ColorPicker } from '@/ui/ColorPicker';

import '@/styles/features/explorer/settings-panel.css';

const ITERATION_VALUE_OPTS = [100, 250, 500, 1000, 2500, 5000].map((num) => {
  const value = '' + num;
  return { value, text: value };
});

// ----------------------------------------------------------------------
// TODO: These are placeholders for now, need to implement the real thing
// Also need to figure out where to put this
const COLOR_STYLE_OPTS = [
  { value: 'gradient', text: 'Gradient' },
  { value: 'smooth', text: 'Smooth' },
  { value: 'solid', text: 'Solid' },
  { value: 'really long text', text: 'Really long text' },
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

function SettingsPanel({
  onItersChange,
}: {
  onItersChange: (iters: number) => void;
}) {
  // ---------------------------------------------------------------
  // TODO: these are placeholdders for now so the code can run
  // Will implement the actual functionality later
  const [color1, setColor1] = useState({ r: 70, g: 70, b: 70 });
  const [color2, setColor2] = useState({ r: 255, g: 255, b: 255 });
  const [colorStyle, setColorStyle] = useState('gradient');
  const [numCPUs, setNumCPUs] = useState(2);
  // ---------------------------------------------------------------

  const [iters, _setIters] = useState(100);
  const setIters = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value, 10);
    _setIters(value);
    onItersChange(value);
  };
  console.log('iters:', iters);

  return (
    // TODO: div.settings-panel should be inside of <SlideOutPanel>
    // Need to adjust the styles accordingly
    <div className='settings-panel'>
      <SlideOutPanel>
        {/* TODO: decide if I want to use this or not */}
        {/* {({ isOpen, setIsOpen }) => ( */}
        {() => (
          <div className='settings-panel-content'>
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

              <SettingsRow label='Color'>
                <ColorPicker color={color1} onChange={setColor1} />
                <ColorPicker color={color2} onChange={setColor2} />
              </SettingsRow>

              {/* TODO: Decide if "Color Style" is the best label, UX-wise */}
              <SettingsRow label='Color Style'>
                <select
                  className='settings-select'
                  value={colorStyle}
                  onChange={(e) => setColorStyle(e.target.value)}
                >
                  {COLOR_STYLE_OPTS.map(({ value, text }) => (
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
    </div>
  );
}

function SlideOutPanel({
  children,
}: {
  children: (...args: any[]) => JSX.Element;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`slide-out-panel-container ${isOpen && 'visible'}`}>
      {isOpen && (
        <div
          className='slide-out-panel-content'
          onMouseLeave={() => setIsOpen(false)}
        >
          {children({ isOpen, setIsOpen })}
        </div>
      )}
      <div
        className='slide-out-panel-opener'
        onMouseEnter={() => setIsOpen(true)}
      ></div>
    </div>
  );
}

export { SettingsPanel };
