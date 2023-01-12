import { DoublyLinkedList } from 'lib/doublyLinkedList';
import { randInt } from 'lib/randInt';

describe('Test doubly linked list', () => {

  describe('can insert an item to front of list', () => {
    test('empty list', () => {
      const list = new DoublyLinkedList();
      const data = 'foo';
      const node = list.insertAtHead(data);

      expect(node.data).toEqual(data);

      expect(Object.is(node, list.head)).toBe(true);
      expect(Object.is(node, list.tail)).toBe(true);

      expect(node.prev).toBeNull();
      expect(node.next).toBeNull();
    });

    test('list with 4 items inserted', () => {
      const items = ['item1', 'item2', 'item3', 'item4'];
      const list = createListByInsertingItems(items);

      expect(list.head.prev).toBeNull();
      expect(list.tail.next).toBeNull();
      expect(list.toArray()).toEqual(items);

      expect(Object.is(list.head, list.head.next.prev)).toBe(true);
      expect(Object.is(
        list.head.next,
        list.head.next.next.prev,
      )).toBe(true);
      expect(Object.is(
        list.head.next.next,
        list.head.next.next.next.prev,
      )).toBe(true);

      expect(Object.is(list.tail, list.tail.prev.next)).toBe(true);
      expect(Object.is(
        list.tail.prev,
        list.tail.prev.prev.next,
      )).toBe(true);
     expect(Object.is(
        list.tail.prev.prev,
        list.tail.prev.prev.prev.next,
      )).toBe(true);
    });

    test('list with many items inserted', () => {
      const NUM_ITEMS = 100;
      const items = [];
      for (let i=1; i<=NUM_ITEMS; i++) {
        items.push(`item${i}`);
      }
      const list = createListByInsertingItems(items);

      expect(list.toArray()).toEqual(items);
      expect(list.head.data).toEqual(items[0]);
      expect(list.tail.data).toEqual(items[items.length-1]);

      expect(list.head.prev).toBeNull();
      expect(list.tail.next).toBeNull();

      const nodes = list.toArrayOfNodes();

      for (let i=0; i<20; i++) {
        const nodeNum = randInt(1, NUM_ITEMS-2);
        const node = nodes[nodeNum];
        const before = nodes[nodeNum-1];
        const after = nodes[nodeNum+1];

        expect(node.data).toEqual(items[nodeNum]);

        expect(Object.is(before, node.prev)).toBe(true);
        expect(Object.is(node, after.prev)).toBe(true);
        expect(Object.is(node, before.next)).toBe(true);
        expect(Object.is(after, node.next)).toBe(true);
      }
    });
  });

  describe('can remove an item from end of list', () => {
    test('should be null for empty list', () => {
      const list = new DoublyLinkedList();
      const tail = list.removeTail();
      expect(tail).toBeNull();
      expect(list.tail).toBeNull();
      expect(list.head).toBeNull();
    }); 

    test('case 1', () => {
      const list = createList(['item1', 'item2', 'item3']);

      const oldTail = list.removeTail(); 
      expect(oldTail.data).toEqual('item3');
      expect(list.tail.data).toEqual('item2');
      expect(list.head.data).toEqual('item1');

      expect(Object.is(list.head.next, list.tail)).toBe(true);
      expect(Object.is(list.tail.prev, list.head)).toBe(true);
      expect(list.tail.next).toBeNull();
    });
  });

  describe('can move item from middle to end of list', () => {
    test('list with items, case 1', () => {
      const list = createList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      const nodes = list.toArrayOfNodes();
      const node6 = nodes.find(node => node.data === 6);
      
      list.moveNodeToHead(node6);
      expect(Object.is(list.head, node6)).toBe(true);
      expect(list.head.prev).toBeNull();
      expect(list.head.next.data).toEqual(1);

      const newItems = [6, 1, 2, 3, 4, 5, 7, 8, 9, 10];
      expect(list.toArray()).toEqual(newItems);

      list.moveNodeToHead(node6);
      // Should do nothing the second time around.
      expect(list.toArray()).toEqual(newItems);
    });
  });
});

function createListByInsertingItems(items) {
  const list = new DoublyLinkedList();
  const reversedItems = [...items].reverse();
  reversedItems.forEach(item => list.insertAtHead(item));
  return list;
}

function createList(orderedItems) {
  return createListByInsertingItems(orderedItems);
}
