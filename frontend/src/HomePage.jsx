import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import './styles/HomePage.css';

import { API_URL } from './settings';
import { request } from './api';

import { LogoutButton } from './features/home/pages/home/LogoutButton';


function fetchSnapshots() {
  return request.get('snapshots');
}

function snapshotImgUrlSmall(shapshot) {
  // const thumnail = shapshot.thumbnails.find(thumb => thumb.height === 100);
  const thumnail = shapshot.thumbnails.find(thumb => thumb.height === 180);
  return `${API_URL}/media/${thumnail.filename}`;
}

function HomePage() {
  const [snapshots, setSnapshots] = useState(null);
  const currentUser = useSelector(state => state.users.currentUser);

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
                    Current User: {currentUser.username}
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

      {snapshots ? 
        <div className='snapshot-gallery'>
          {snapshots.map(snapshot => (
            <div className='snapshot-gallery-item' key={snapshot.id}>
              <a href={snapshot.link} target='_blank'>
                {snapshot.description}
              </a>
              <img
                src={snapshotImgUrlSmall(snapshot)}
              />
            </div>
          ))}
        </div> :
        <p>no snapshots...</p>
      }
    </div>
  );
}

export { HomePage };
