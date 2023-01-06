import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import './styles/HomePage.css';

import { API_URL } from './settings';
import { request } from './api';

import { selectCurrentUser } from './features/users/usersSlice';
import { LogoutButton } from './features/home/pages/home/LogoutButton';

import {
  SnapshotThumbnail,
  SnapshotGallery 
} from './features/snapshots/components/SnapshotThumbnail';


// TODO: pass `ordering=-created_at` query parameter
function fetchSnapshots() {
  return request.get('snapshots');
}

function HomePage() {
  const [snapshots, setSnapshots] = useState(null);
  const currentUser = useSelector(selectCurrentUser);

  useEffect(() => {
    console.log('Home Page -- useEffect -- fetchSnapshots');
    fetchSnapshots().then(data => setSnapshots(data));
  }, []);

  return (
    <div className='home-page-container'>
      <header className='app-header'>
        <h1 className='app-title'>Frac Vizzy</h1>

        <nav>
          <div className='links'>
            <Link to='explore'>Explore</Link>
          </div>
          <div className='user-section'>
            {currentUser ? (
                <>
                  <span className='profile-link'>
                    Current User: 
                    <Link to={`profile/${currentUser.id}`}>
                      {currentUser.username}
                    </Link>
                  </span> 
                  <LogoutButton />
                </>
              ) : (
                <Link to='login'>Login</Link>
              )
            }
          </div>
        </nav>
      </header>

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
