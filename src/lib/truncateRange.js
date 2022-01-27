
/*
  `granularity` determines how precise the truncated number should be.
  It is interpreted in terms of the length of the range.
  Think of it as saying "What percentage movement of the range is acceptable?".
  E.g. 0.001 means it is acceptable if the truncated range is shifted by up to
    0.1% to the left or the right.
*/
function truncateRange(range, granularity) {
  const minMeaningfulUnitSize = (range.end - range.start) * granularity;
  const decimalPlacesToKeep = Math.ceil(-1 * Math.log10(minMeaningfulUnitSize));
  return {
    start: parseFloat(range.start.toFixed(decimalPlacesToKeep)),
    end: parseFloat(range.end.toFixed(decimalPlacesToKeep)),
  };
}

export { truncateRange };
