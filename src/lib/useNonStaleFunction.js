import { useEffect, useRef } from 'react';

// NOTE: Not sure if this is the idiomatic way of solving this problem.
// It seems nice though. It is fairly unobtrusive.
// ----------------------------------------------------------------------
// `funcRef` will always have a reference to most recent value for `func`
function useNonStaleFunction(func) {
  const funcRef = useRef(func);
  useEffect(() => {
    funcRef.current = func;
  }, [func]);
  return (...args) => funcRef.current(...args);
}

export { useNonStaleFunction };
