import React, { useState } from 'react';
import classnames from 'classnames';

import '../styles/ui/ColorPicker.css';

import { RgbColorPicker } from 'react-colorful'

function ColorPicker({ onChange, color }) {
  const [isShowing, setIsShowing] = useState(false);
  const [newColor, setNewColor] = useState(color);

  return (
    <div
      className={classnames('color-picker', {
        'is-editing': isShowing,
      })}
    >
      {isShowing &&
        <div className='picker-panel'>
          {/* TODO: Add "close" X-icon in upper right (or something) */}
          <RgbColorPicker color={newColor} onChange={setNewColor} />

          {/* TODO: improve button design. Primary / secondary colors */}
          <div className='btn-row'>
            <button onClick={() => setIsShowing(false)}>
              Cancel
            </button>
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
      }

      <div
        className='current-color'
        style={{background: rgbToCssString(color || newColor)}}
        onClick={() => setIsShowing(val => !val)}
      />
    </div>
  );
}

function rgbToCssString({ r, g, b }) {
  return `rgb(${r},${g},${b})`;
}

export { ColorPicker };
