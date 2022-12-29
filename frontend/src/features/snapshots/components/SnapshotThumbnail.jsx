import './SnapshotThumbnail.css';

import { API_URL } from '../../../settings';

import { DateTime } from '../../../ui/DateTime';


// TODO: Make this better..?
function thumbnailUrl(snap) {
  const thumbnail = snap.thumbnails.find(t => t.height === 180);
  return `${API_URL}/media/${thumbnail.filename}`;
}

// TODO: implement isAuthorVisible
function SnapshotThumbnail({ snap, isAuthorVisible=false }) {
  // TODO: Populate this!! Right now it's just an ID.
  const user = snap.author;

  return (
    <div className='snapshot-thumbnail' key={snap.id}>
      <img
        src={thumbnailUrl(snap)}
        alt={snap.description}
      />

      {/* TODO: only show on hover? */}
      <div className='snap-info'>
        {/* <div className='snap-author'>{user.username}</div> */}
        <div className='snap-misc-info'>
          <a href={snap.link} target='_blank'>
            {snap.description}
          </a>
        </div>

        <div className='snap-date'>
          <DateTime string={snap.created_at}/>
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
