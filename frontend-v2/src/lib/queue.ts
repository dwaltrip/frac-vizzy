// TODO: Make this a priority queue
class Queue<T> {
  private queue: T[] = [];

  get isEmpty(): boolean {
    return this.length === 0;
  }

  // TODO: Make it impossible for an item to be added to the queue twice.
  // One idea: print a warning and ignore the item if it's already in the queue.
  enqueue(item: T) {
    this.queue.push(item);
  }

  enqueueAll(itemList: Iterable<T>) {
    this.queue.push(...itemList);
  }

  dequeue(): T | undefined {
    // if (this.length === 0) {
    //   throw new Error('Queue is empty');
    // }
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
