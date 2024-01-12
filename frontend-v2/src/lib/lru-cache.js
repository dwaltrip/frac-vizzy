import { assert } from 'lib/assert';
import { DoublyLinkedList } from 'lib/linked-list';

class LRUCache {
  _cache = {};
  _LRULinkedList = new DoublyLinkedList();
  _keyToNodeMap = {};

  constructor({ getKey, maxSize }) {
    assert(getKey, 'Must pass getKey');
    assert(maxSize, 'Must pass maxSize');
    this.getKey = getKey;
    this.maxSize = maxSize;
  }

  hasItem(item) {
    const key = this.getKey(item);
    return key in this._cache;
  }

  getItem(item) {
    const key = this.getKey(item);
    assert(this.hasItem(item), `Item key ${key} is not in cache`);
    // This item is now the most recently accessed
    this._LRULinkedList.moveNodeToHead(this._keyToNodeMap[key]);
    return this._cache[key];
  }

  addItem(item) {
    const key = this.getKey(item);
    if (this.size >= this.maxSize) {
      const node = this._LRULinkedList.removeTail();
      const keyToRemove = node.data;
      delete this._cache[keyToRemove];
      delete this._keyToNodeMap[keyToRemove];
    }
    this._keyToNodeMap[key] = this._LRULinkedList.insertAtHead(key);
    this._cache[key] = item;
  }

  get size() {
    return this._LRULinkedList.length;
  }
}

export { LRUCache };
