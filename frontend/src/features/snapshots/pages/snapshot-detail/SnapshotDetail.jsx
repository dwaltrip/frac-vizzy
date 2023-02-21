import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import './SnapshotDetail.css';

import { selectToken } from 'features/users/usersSlice';
import {
  loadSnapDetails,
  selectSnapshotWithDetails,
  likeSnapshot,
} from 'features/snapshots/snapshotsSlice';

import { DateTime } from 'ui/DateTime';
import { AppHeader } from 'common/AppHeader';

import { thumbnailUrlOriginal } from 'features/snapshots/common/thumbnailUrl';

function SnapshotDetail() {
  const dispatch = useDispatch();
  const { snapId } = useParams();

  useEffect(() => {
    dispatch(loadSnapDetails(snapId));
  }, [snapId, dispatch]);

  const snap = useSelector(state => selectSnapshotWithDetails(state, snapId));
  const token = useSelector(selectToken);

  async function onClickLikeButton() {
    // TODO: I shouldn't have to pass the token here..
    // It should happen automatically for all API calls
    await dispatch(likeSnapshot({ snap, token }));
  }

  return (
    <div className='snapshot-detail-page'>
      <AppHeader />

      <div className='page-content'>
        {snap &&
          <div style={{ marginBottom: '10px' }}>
            <div>{snap.description}</div>
            <div>{snap.author.username}</div>
            <div>Likes: {snap.like_count}</div>
            <DateTime string={snap.created_at}/>
            <div>
              Liked by:
              {snap.liked_by.length > 0 ?
                (' ' + snap.liked_by.map(user => user.username).join(', ')) :
                ' none'
              }
            </div>
            <button
              onClick={onClickLikeButton}
            >
              Like
            </button>
          </div>
        }

        {snap &&
          <div className='img-container'>
            <img
              src={thumbnailUrlOriginal(snap)}
              alt={snap.description}
            />
          </div>
        }
      </div>

    </div>
  );
}

export { SnapshotDetail };
