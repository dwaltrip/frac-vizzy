import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

import 'styles/ProfilePage.css';

import { API_URL } from 'settings';
import { request } from 'api';
import { loadUserDetails, selectUserById } from 'features/users/usersSlice';
import {
  loadSnapshotsForUser,
  selectSnapshotsForUser,
} from 'features/snapshots/snapshotsSlice';

import { DateTime } from 'ui/DateTime';
import { AppHeader } from 'common/AppHeader';

import {
  SnapshotThumbnail,
  SnapshotGallery 
} from 'features/snapshots/components/SnapshotThumbnail';



function ProfilePage() {
  const dispatch = useDispatch();
  const { userId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(async () => {
    if (!hasFetched) {
      setIsLoading(true);
      // TODO: handle case where invalid user ID is passed.
      await Promise.all([
        dispatch(loadUserDetails(userId)),
        dispatch(loadSnapshotsForUser(userId)),
      ]);
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [userId, hasFetched]);

  const user = useSelector(state => selectUserById(state, userId));
  const snaps = useSelector(state => selectSnapshotsForUser(state, userId));

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="ProfilePage">
      <AppHeader />

      <div className="ProfilePage-header">
        {/*<img src={user.profilePictureUrl} alt="Profile" />*/}
        <h1>{user.username}'s profile</h1>
      </div>

      <SnapshotGallery>
        {/* TODO: Show snaps already in store while we get latest from API? */}
        {(isLoading || !snaps) ?
          <p>Loading...</p> :
          <>
            {(snaps.length === 0) && <div>No snapshots</div>}

            {snaps.map(snap => (
              <SnapshotThumbnail snap={snap} key={snap.id} />
            ))}
          </>
        }
      </SnapshotGallery>
    </div>
  );
}

export { ProfilePage };
