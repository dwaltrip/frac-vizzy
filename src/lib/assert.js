
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion error.")
  }
}

export { assert };
