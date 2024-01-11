function deepClone(obj: Record<string, any>) {
  return JSON.parse(JSON.stringify(obj));
}

export { deepClone };
