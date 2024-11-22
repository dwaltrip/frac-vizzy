import '@/styles/features/explorer/settings-panel.css';
import { useState } from 'react';

function SettingsPanel() {
  return (
    <div className='settings-panel'>
      <SlideOutPanel>
        <div className='settings-panel-content'>Settings Panel</div>
      </SlideOutPanel>
    </div>
  );
}

function SlideOutPanel({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`slide-out-panel-container ${isOpen && 'visible'}`}>
      {isOpen && (
        <div
          className='slide-out-panel-content'
          onMouseLeave={() => setIsOpen(false)}
        >
          {children}
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
