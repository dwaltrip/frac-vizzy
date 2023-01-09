import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import 'styles/HomePage.css';

import { request } from 'api';

import { AppHeader } from 'common/AppHeader';
import {
  SnapshotThumbnail,
  SnapshotGallery 
} from 'features/snapshots/components/SnapshotThumbnail';


// TODO: pass `ordering=-created_at` query parameter
// TODO: make a thunk
function fetchSnapshots() {
  return request.get('snapshots');
}

function HomePage() {
  const [snapshots, setSnapshots] = useState(null);

  useEffect(() => {
    fetchSnapshots().then(data => setSnapshots(data));
  }, []);

  return (
    <div className='home-page-container'>
      <AppHeader />

      {snapshots ? (
        <SnapshotGallery>
          {snapshots.map(snap => (
            <SnapshotThumbnail snap={snap} key={snap.id} />
          ))}
        </SnapshotGallery>
      ) : (
        <p>no snapshots...</p>
      )}
    </div>
  );
}

export { HomePage };
