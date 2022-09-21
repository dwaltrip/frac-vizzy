
// Random integer from the range [a, b].
// It is inclusive of both endpoints
function randInt(a, b) {
  const dist = b - a;
  return a + Math.floor(Math.random() * (dist + 1));
}

export { randInt };
