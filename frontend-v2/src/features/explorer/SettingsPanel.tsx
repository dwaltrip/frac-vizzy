import '@/styles/features/explorer/settings-panel.css';
import { useState } from 'react';

const ITERATION_VALUE_OPTS = [100, 250, 500, 1000, 2500, 5000].map((num) => {
  const value = '' + num;
  return { value, text: value };
});

function SettingsPanel({
  onItersChange,
}: {
  onItersChange: (iters: number) => void;
}) {
  const [iters, _setIters] = useState(100);
  const setIters = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value, 10);
    _setIters(value);
    onItersChange(value);
  };
  console.log('iters:', iters);

  return (
    <div className='settings-panel'>
      <SlideOutPanel>
        {({ isOpen, setIsOpen }) => (
          <div className='settings-panel-content'>
            <div className='header'>Settings Panel</div>
            <div className='settings-row'>
              <label>Iterations</label>
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
      {/* <div className='slide-out-panel-opener'></div> */}
      <div
        className='slide-out-panel-opener'
        onMouseEnter={() => setIsOpen(true)}
      ></div>
    </div>
  );
}

export { SettingsPanel };
