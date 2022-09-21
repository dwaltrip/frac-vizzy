import React, { useState } from 'react';

import './SelectWithCustomValues.css';

const CUSTOM_VALUE = {
  value: '__CUSTOM_VALUE__',
  text: 'Custom',
}

// TODO: the buttons feel a bit big / unweildy? slim them down?
function SelectWithCustomValues({ value, options, onChange }) {
  const hasCustomValue = !options.some(opt => opt.value === value);

  const [isEditingCustomValue, setIsEditingCustomValue] = useState(hasCustomValue);
  const [inputValue, setInputValue] = useState(value);

  const hasUnsavedChanges = value !== inputValue;

  const selectOnChange = event => { 
    const newVal = event.target.value;
    if (newVal === CUSTOM_VALUE.value) {
      setInputValue(value);
      setIsEditingCustomValue(true);
    }
    else {
      onChange(newVal);
      setIsEditingCustomValue(false);
    }
  };

  const submitCustomValue = () => onChange(inputValue);

  return (
    <div className='select-with-custom-option'>
      <div className='select-form-row'>
        <select
          value={(isEditingCustomValue || hasCustomValue) ? CUSTOM_VALUE.value : value}
          onChange={selectOnChange}
        > 
          {options.map(opt => (
            <option value={opt.value} key={opt.value}>
              {opt.text}
            </option>
          ))}
          <option value={CUSTOM_VALUE.value} key={CUSTOM_VALUE.value}>
            {CUSTOM_VALUE.text}
          </option>
        </select>
      </div>

      {(isEditingCustomValue || hasCustomValue) &&
        <>
          <div className='select-form-row'>
            {/* TODO: give this input focus as soon as it shows on the page */}
            <input
              type='text'
              className='custom-value-input'
              value={inputValue}
              onChange={event => setInputValue(event.target.value)}
            />
          </div>

          <div className='select-form-row'>
            <button onClick={submitCustomValue} disabled={!hasUnsavedChanges}>
              OK
            </button>
            <button
              onClick={() => {
                setInputValue(value);
                setIsEditingCustomValue(false);
              }}
              disabled={value === inputValue}
            >
              Cancel
            </button>
          </div>
        </>
      }
    </div>
  );
}

export { SelectWithCustomValues };
