class IdGenerator {
  private cache = new Map();
  private length: number;

  static chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

  constructor(length: number) {
    this.length = length;
  }

  static asFunc(length: number): () => string {
    const generator = new IdGenerator(length);
    return () => generator.generate();
  }

  private _generate(): string {
    let id = '';
    for (let i = 0; i < this.length; i++) {
      id += IdGenerator.chars[randInt(IdGenerator.chars.length)];
    }
    return id;
  }

  generate(): string {
    let id = this._generate();
    while (this.cache.has(id)) {
      id = this._generate();
    }
    this.cache.set(id, true);
    return id;
  }
}

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export { IdGenerator };
