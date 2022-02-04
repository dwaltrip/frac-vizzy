// https://stackoverflow.com/a/27078401/111635
// Throttle implementation from underscore.js (underscore references removed)

// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.

// NOTE: One day, it would be nice to understand why this implementation works
// perfectly and what was wrong with my implemenation.

function throttle(func, wait, options) {
  let context;
  let args;
  let result;

  let timeout = null;
  let previous = 0;
  if (!options) {
    options = {};
  }

  const later = function() {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };

  return function() {
    const now = Date.now();
    if (!previous && options.leading === false) {
      previous = now;
    }

    context = this;
    args = arguments;

    const remaining = wait - (now - previous);
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        window.clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) {
        context = args = null;
      }
    }
    else if (!timeout && options.trailing !== false) {
      timeout = window.setTimeout(later, remaining);
    }
    return result;
  };
};

export { throttle };
