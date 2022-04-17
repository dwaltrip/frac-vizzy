function segmentArray(array, chunkSize) {
  const result = [];

  let currChunk = [];
  array.forEach((item, i) => {
    if (currChunk.length < chunkSize) {
      currChunk.push(item);
    }

    if (currChunk.length === chunkSize) {
      result.push(currChunk)
      currChunk = [];
    }
  });

  // This only happens if the array doesn't divide evenly.
  if (currChunk.length > 0) {
    result.push(currChunk);
  }

  return result;
}

export { segmentArray };
