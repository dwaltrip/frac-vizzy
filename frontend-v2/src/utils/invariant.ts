// TODO: log these occurrences in production
// TODO: should probably consolidate the `lib` and `utils` directories?
function invariant(condition: boolean, message?: string) {
  if (condition) {
    return;
  }

  const stack = new Error().stack;
  const location = stack?.split('\n')[2];
  console.error(`Invariant failed (${location})`);
  if (message) {
    console.error(message);
  }
}

export { invariant };
