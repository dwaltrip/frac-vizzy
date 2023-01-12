import { useEffect, useRef } from 'react';

import { throttle } from 'lib/throttle';
import {  useNonStaleFunction } from 'lib/useNonStaleFunction';

function useThrottledFunc(fn, wait) {
  const nonStaleFn = useNonStaleFunction(fn);
  const fnRef = useRef(nonStaleFn);

  useEffect(() => {
    fnRef.current = throttle(nonStaleFn, wait);
  }, []);

  return (...args) => fnRef.current(...args);
}

export { useThrottledFunc };
