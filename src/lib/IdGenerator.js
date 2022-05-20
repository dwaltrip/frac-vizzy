import { randInt } from './randInt';

const CHARS = 'abcdefghijklmnopqrstuvwxyz1234567890';
const ID_SIZE = 4;

function randString(numChars) {
  let str = '';
  for (let i=0; i<numChars; i++) {
    str += CHARS[randInt(0, CHARS.length - 1)];
  }
  return str;
}

function createIdGenerator() {
  const _previousIds = {};

  return function generateId() {
    let id = randString(ID_SIZE);
    while (id in _previousIds) {
      id = randString(ID_SIZE);
    }
    _previousIds[id] = true;
    return id;
  };
}

export { createIdGenerator };
