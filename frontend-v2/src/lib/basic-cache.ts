// TODO: make this better
class BasicCache<Value> {
  private cache = new Map<string, Value>();

  get(key: string): Value {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    throw new Error(`BasicCache: key ${key} not found`);
  }

  set(key: string, value: Value) {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

export { BasicCache };
