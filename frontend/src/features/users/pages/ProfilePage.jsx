import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

import '../../../styles/ProfilePage.css';

import { API_URL } from '../../../settings';
import { request } from '../../../api';
import { loadUserDetails, selectUserById } from '../usersSlice';
// import {
//   loadSnapshotsForUser,
//   selectSnapshotsForUser,
// } from '../../snpashots/snapshotsSlice';

import { DateTime } from '../../../ui/DateTime';
import {
  SnapshotThumbnail,
  SnapshotGallery 
} from '../../snapshots/components/SnapshotThumbnail';


function fetchSnaps(userId) {
  return request.get('snapshots', { query: { author_id: userId }});
}

function ProfilePage() {
  const dispatch = useDispatch();
  const { userId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [snaps, setSnaps] = useState([]);

  useEffect(async () => {
    if (!hasFetched) {
      setIsLoading(true);
      // await Promise.all([
      //   dispatch(loadUserDetails(userId)),
      //   dispatch(loadSnapshotsForUser(userId)),
      // ]);
      await dispatch(loadUserDetails(userId));
      const snapsResponse = await fetchSnaps(userId);
      setSnaps(snapsResponse);
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [userId, hasFetched]);

  const user = useSelector(state => selectUserById(state, userId));
  // const snaps = useSelector(
  //   state => selectSnapshotsForUser(state, userId)
  // );

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="ProfilePage">
      <div>
        <Link to='/'>Home</Link>
      </div>

      <div className="ProfilePage-header">
        {/*<img src={user.profilePictureUrl} alt="Profile" />*/}
        <h1>{user.username}</h1>
      </div>

      <SnapshotGallery>
        {snaps.length === 0 && <div>No snapshots</div>}

        {snaps.map(snap => (
          <SnapshotThumbnail snap={snap} key={snap.id} />
        ))}
      </SnapshotGallery>
    </div>
  );
}

export { ProfilePage };
