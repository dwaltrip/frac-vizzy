import { useState } from 'react';
import { RgbColorPicker } from 'react-colorful';
import classnames from 'classnames';

import '@/styles/ui/color-picker.css';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface ColorPickerProps {
  onChange: (color: RgbColor) => void;
  color: RgbColor;
}

function ColorPicker({ onChange, color }: ColorPickerProps) {
  const [isShowing, setIsShowing] = useState<boolean>(false);
  const [newColor, setNewColor] = useState<RgbColor>(color);

  return (
    <div
      className={classnames('color-picker', {
        'is-editing': isShowing,
      })}
    >
      {isShowing && (
        <div className='picker-panel'>
          {/* TODO: Add "close" X-icon in upper right (or something) */}
          <RgbColorPicker color={newColor} onChange={setNewColor} />

          {/* TODO: improve button design. Primary / secondary colors */}
          <div className='btn-row'>
            <button onClick={() => setIsShowing(false)}>Cancel</button>
            <button
              onClick={() => {
                onChange(newColor);
                setIsShowing(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div
        className='current-color'
        style={{ background: rgbToCssString(color || newColor) }}
        onClick={() => setIsShowing((val) => !val)}
      />
    </div>
  );
}

function rgbToCssString({ r, g, b }: RgbColor): string {
  return `rgb(${r},${g},${b})`;
}

export { ColorPicker };
