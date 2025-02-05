import {
  useState,
  ChangeEvent,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';

import '@/styles/ui/select-with-custom-value.css';
import classnames from 'classnames';

interface Option {
  value: string;
  text: string;
}

interface SelectWithCustomValueProps {
  value: string | number;
  options: Option[];
  onChange: (value: string) => void;
  label?: string;
  styled?: boolean;
  className?: string;
  selectClassName?: string;
}

interface SelectWithCustomValueHandles {
  resetCustomValue: () => void;
}

const CUSTOM_VALUE: Option = {
  value: '__CUSTOM_VALUE__',
  text: 'Custom',
};

const SelectWithCustomValue = forwardRef<
  SelectWithCustomValueHandles,
  SelectWithCustomValueProps
>(
  (
    {
      value: rawValue,
      options,
      onChange,
      label = CUSTOM_VALUE.text,
      styled = false,
      className,
      selectClassName,
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const value: string = '' + rawValue;
    const hasCustomValue = !options.some((opt) => opt.value === value);

    const [isEditing, setIsEditing] = useState<boolean>(hasCustomValue);
    const [customValue, setCustomValue] = useState<string>(value);
    const hasUnsavedChanges = value !== customValue;

    useImperativeHandle(ref, () => ({
      resetCustomValue: () => {
        setCustomValue(value);
        setIsEditing(false);
      },
    }));

    const selectOnChange = (event: ChangeEvent<HTMLSelectElement>): void => {
      const newVal = event.target.value;
      if (newVal === CUSTOM_VALUE.value) {
        setCustomValue(value);
        setIsEditing(true);
      } else {
        onChange(newVal);
        setIsEditing(false);
      }
    };

    useEffect(() => {
      if (isEditing) {
        inputRef.current?.focus();
      }
    }, [isEditing]);

    const saveCustomValue = () => {
      onChange(customValue);
      setIsEditing(false);
    };

    return (
      <div
        className={classnames(
          'select-with-custom-value',
          styled ?? 'styled',
          className,
        )}
      >
        <div className='select-form-row'>
          <select
            value={isEditing || hasCustomValue ? CUSTOM_VALUE.value : value}
            onChange={selectOnChange}
            className={classnames(selectClassName)}
          >
            {options.map((opt) => (
              <option value={opt.value} key={opt.value}>
                {opt.text}
              </option>
            ))}
            <option value={CUSTOM_VALUE.value} key={CUSTOM_VALUE.value}>
              {label}
            </option>
          </select>
        </div>

        <div
          className={classnames(
            'select-form-row',
            !(isEditing || hasCustomValue) && 'hidden',
          )}
        >
          {/* TODO: this shouldn't be a plain text field, should be numbers only */}
          {/* TODO: Enter should save, Esc should cancel */}
          <input
            type='text'
            className='custom-value-input'
            value={customValue}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setCustomValue(event.target.value)
            }
            onFocus={() => setIsEditing(true)}
            ref={inputRef}
          />
        </div>

        {isEditing && (
          <div className='select-form-row'>
            <button onClick={saveCustomValue} disabled={!hasUnsavedChanges}>
              Ok
            </button>
            <button
              onClick={() => {
                setCustomValue(value);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  },
);

export { SelectWithCustomValue, type SelectWithCustomValueHandles };
