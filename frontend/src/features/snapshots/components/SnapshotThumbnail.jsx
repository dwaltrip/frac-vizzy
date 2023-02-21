import { Link } from 'react-router-dom';

import './SnapshotThumbnail.css';

import { API_URL } from 'settings';

import { pluralize } from 'ui/lib/pluralize';
import { DateTime } from 'ui/DateTime';
import { thumbnailUrlBySize } from 'features/snapshots/common/thumbnailUrl';

function SnapshotThumbnail({ snap }) {
  return (
    <div className='snapshot-thumbnail' key={snap.id}>
      <img
        src={thumbnailUrlBySize(snap, { height: 180 })}
        alt={snap.description}
      />

      {/* TODO: only show on hover? */}
      <div className='snap-info'>
        {/* <div className='snap-author'>{user.username}</div> */}
        <div className='snap-misc-info'>
          {/*
            TODO: use target=_blank ??
            The link should be something other than the description.
            How do other social sites do it? Twitter uses timestamp I think?
          */}
          <Link to={`/snapshot/${snap.id}`}>
            {snap.description}
          </Link>
          <div className='like-count'>
            {pluralize(snap.like_count, 'like')}
          </div>
        </div>

        <div className='snap-misc-info'>
          <div>
            {snap.author.username}
          </div>
          <div className='snap-date'>
            <DateTime string={snap.created_at}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// TODO: move to own file
function SnapshotGallery({ className=null, children }={}) {
  return (
    <div className={`snapshot-gallery ${className || ''}`}>
      {children}
    </div>
  );
}

export { SnapshotThumbnail, SnapshotGallery };
