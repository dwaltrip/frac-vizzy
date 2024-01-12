class DoublyLinkedList {
  head = null;
  tail = null;
  _length = 0;

  insertAtHead(data) {
    const oldHead = this.head;
    const newNode = new Node(data, { next: oldHead });
    if (oldHead) {
      oldHead.prev = newNode;
    } else {
      this.tail = newNode;
    }
    this.head = newNode;
    this._length += 1;
    return newNode;
  }

  removeTail() {
    const oldTail = this.tail;
    if (oldTail) {
      this.tail = oldTail.prev;
      this.tail.next = null;
    } else {
      this.tail = null;
    }

    if (!this.tail) {
      this.head = null;
    }

    this._length -= 1;
    return oldTail || null;
  }

  moveNodeToHead(node) {
    if (node === this.head) {
      return;
    }

    const { prev, next } = node;
    if (prev) {
      prev.next = next;
    }
    if (next) {
      next.prev = prev;
    }

    if (this.tail === node) {
      this.tail = prev;
    }

    const oldHead = this.head;
    node.next = oldHead;
    node.prev = null;
    if (oldHead) {
      oldHead.prev = node;
    }
    this.head = node;
  }

  get length() {
    return this._length;
  }

  toArray() {
    return this.toArrayOfNodes().map((node) => node.data);
  }

  toArrayOfNodes() {
    const array = [];
    let curr = this.head;
    while (curr) {
      array.push(curr);
      curr = curr.next;
    }
    return array;
  }
}

class Node {
  constructor(data, { prev, next }) {
    this.data = data;
    this.prev = prev || null;
    this.next = next || null;
  }
}

export { DoublyLinkedList };
