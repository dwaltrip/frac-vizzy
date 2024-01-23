class Queue<T> {
  private queue: T[] = [];

  get isEmpty(): boolean {
    return this.length === 0;
  }

  enqueue(params: T) {
    this.queue.push(params);
  }

  dequeue(): T | undefined {
    if (this.length === 0) {
      throw new Error('Queue is empty');
    }
    return this.queue.shift();
  }

  replace(items: Iterable<T>) {
    this.queue = [...items].reverse();
  }

  get length() {
    return this.queue.length;
  }
}

export { Queue };
