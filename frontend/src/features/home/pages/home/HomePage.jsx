import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import 'styles/HomePage.css';

import {
  loadAllSnapshots,
  selectAllSnapshotsOrderedByDate,
} from 'features/snapshots/snapshotsSlice';

import { AppHeader } from 'common/AppHeader';
import {
  SnapshotThumbnail,
  SnapshotGallery 
} from 'features/snapshots/components/SnapshotThumbnail';

function HomePage() {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await dispatch(loadAllSnapshots());
      setIsLoading(false);
    };
    fetchData();
  }, [dispatch]);

  const snapshots = useSelector(state => selectAllSnapshotsOrderedByDate(state));

  return (
    <div className='home-page-container'>
      <AppHeader />

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        snapshots ? (
          <SnapshotGallery>
            {snapshots.map(snap => (
              <SnapshotThumbnail snap={snap} key={snap.id} />
            ))}
          </SnapshotGallery>
        ) : (
          <p>no snapshots...</p>
        )
      )}
    </div>
  );
}

export { HomePage };
