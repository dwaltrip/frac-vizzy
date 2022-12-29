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


function fetchPhotos(userId) {
  return request.get('snapshots', { query: { author_id: userId }});
}

// TODO: This was copied from HomePage. Make this better...
function snapshotImgUrlSmall(shapshot) {
  // const thumnail = shapshot.thumbnails.find(thumb => thumb.height === 180);
  const thumnail = shapshot.thumbnails.find(thumb => thumb.height === 540);
  return `${API_URL}/media/${thumnail.filename}`;
}

// TODO: handle case where invalid user ID is passed.
function ProfilePage() {
  const dispatch = useDispatch();
  const { userId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [photos, setPhotos] = useState([]);

  useEffect(async () => {
    if (!hasFetched) {
      setIsLoading(true);
      // await Promise.all([
      //   dispatch(loadUserDetails(userId)),
      //   dispatch(loadSnapshotsForUser(userId)),
      // ]);
      await dispatch(loadUserDetails(userId));
      const photosResponse = await fetchPhotos(userId);
      setPhotos(photosResponse);
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [userId, hasFetched]);

  const user = useSelector(state => selectUserById(state, userId));
  // const photos = useSelector(
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

      <div className="ProfilePage-photos">
        {photos.length === 0 && <div>No snapshots</div>}

        {photos.map(photo => (
          <div className="ProfilePage-photo" key={photo.id}>
            <img
              src={snapshotImgUrlSmall(photo)}
              alt={photo.description}
            />
            <div className="ProfilePage-photo-info">
              <div className="ProfilePage-photo-author">
                {/* TODO: this should be the user who saved the snapshot */}
                {user.username}
              </div>
              <div className="ProfilePage-photo-date">
                <DateTime string={photo.created_at}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ProfilePage };
