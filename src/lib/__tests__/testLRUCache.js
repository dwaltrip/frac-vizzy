import { LRUCache } from '../LRUCache';

describe('Test LRUCache', () => {

  describe('Test can add and fetch items', () => {
    test('simple example', () => {
      const cache = createCache();

      const items = ['item-1', 'item-2', 'item-3'];
      items.forEach(item => cache.addItem(item));

      items.forEach((item, i) => {
        expect(cache.getItem(item)).toEqual(items[i]);
      });
    });
  });

  describe('Test that older items are removed once limit is hit', () => {
    test('case 1, small number of items', () => {
      const cache = createCache({ maxSize: 3 });
      const items = ['item-1', 'item-2', 'item-3'];

      items.forEach(item => cache.addItem(item));
      items.forEach(item => expect(cache.getItem(item)).toEqual(item));

      cache.addItem('item-4');
      expect(cache.hasItem('item-1')).toEqual(false);
      items.shift(); // remove first element of items
      items.forEach(item => expect(cache.getItem(item)).toEqual(item));
    });

    test('case 2, more items', () => {
      const SIZE = 50;
      const cache = createCache({ maxSize: SIZE });

      const itemsRound1 = [];
      const itemsRound2 = [];
      const itemsRound3 = [];
      for (let i=1; i<=SIZE; i++) {
        itemsRound1.push(`round-1--item-${i}`);
        itemsRound2.push(`round-2--item-${i}`);
        itemsRound3.push(`round-3--item-${i}`);
      }

      // -- Insert first set of items --
      itemsRound1.forEach(item => cache.addItem(item));
      itemsRound1.forEach(item => expect(cache.getItem(item)).toEqual(item));

      // -- Insert second set of items --
      itemsRound2.forEach(item => cache.addItem(item));
      // Round 1 items should all be removed.
      itemsRound1.forEach(item => expect(cache.hasItem(item)).toEqual(false));
      // Round 2 items should be present in cache.
      itemsRound2.forEach(item => expect(cache.getItem(item)).toEqual(item));

      // -- Insert third set of items --
      itemsRound3.forEach(item => cache.addItem(item));
      // Round 2 items should all be removed.
      itemsRound2.forEach(item => expect(cache.hasItem(item)).toEqual(false));
      // Round 3 items should be present in cahce.
      itemsRound3.forEach(item => expect(cache.getItem(item)).toEqual(item));
    });
  });
});

function createCache({ maxSize }={}) {
  return new LRUCache({
    getKey: keyStr => keyStr,
    maxSize: maxSize || 100,
  });
}
