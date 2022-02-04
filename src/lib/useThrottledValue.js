import { useEffect, useState, useRef } from 'react';

import { throttle } from './throttle';

function useThrottledValue(value, intervalLength) {
  const [_value, _setValue] = useState(value);
  const setThrottledValue = useRef(() => {
    throw new Error('Throttled setter not ready... (this should not happen).');
  });

  if (typeof intervalLength === 'undefined') {
    throw new Error('intervalLength is a required argument');
  }

  useEffect(() => {
    setThrottledValue.current = throttle(
      newVal => _setValue(newVal),
      intervalLength,
    );
  }, []);

  useEffect(() => {
    setThrottledValue.current(value);
  }, [value]);

  return _value;
}

export { useThrottledValue };
