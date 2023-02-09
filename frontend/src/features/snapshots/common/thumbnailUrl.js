import { API_URL } from 'settings';

import { assert } from 'lib/assert';

export const THUMBNAIL_SIZES = [
    { width: 100, height: 100 },
    { width: 320, height: 180 },
    { width: 960, height: 540 },
];
const HEIGHTS = THUMBNAIL_SIZES.map(size => size.height);

function thumbnailUrlBySize(snap, { height }) {
  assert(!!height, 'must provie height');
  assert(HEIGHTS.includes(height), 'must provie height');
  const thumbnail = snap.thumbnails.find(t => t.height == height);
  // TODO: Create a generic helper for building static URLs.
  return `${API_URL}/media/${thumbnail.filename}`;
}

function thumbnailUrlOriginal(snap) {
  const thumbnail = snap.thumbnails.find(t => t.is_original);
  // TODO: Create a generic helper for building static URLs.
  return `${API_URL}/media/${thumbnail.filename}`;
}

export { thumbnailUrlBySize, thumbnailUrlOriginal };
