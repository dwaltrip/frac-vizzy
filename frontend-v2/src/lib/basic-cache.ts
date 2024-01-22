// TODO: make this better
class BasicCache<Value> {
  private cache = new Map<string, Value>();

  getKey(key: string): Value {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    throw new Error(`BasicCache: key ${key} not found`);
  }

  setKey(key: string, value: Value) {
    this.cache.set(key, value);
  }

  hasKey(key: string): boolean {
    return this.cache.has(key);
  }
}

export { BasicCache };
