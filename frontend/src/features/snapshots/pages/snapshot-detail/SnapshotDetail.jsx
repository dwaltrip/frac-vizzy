import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import './SnapshotDetail.css';

import {
  loadSnapDetails,
  selectSnapshotWithAuthorById,
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

  const snap = useSelector(state => selectSnapshotWithAuthorById(state, snapId));

  return (
    <div className='snapshot-detail-page'>
      <AppHeader />

      <div className='page-content'>
        {snap &&
          <>
            <div>{snap.description}</div>
            <div>{snap.author.username}</div>
            <DateTime string={snap.created_at}/>
          </>
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
