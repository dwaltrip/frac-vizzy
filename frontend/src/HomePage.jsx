import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import './styles/HomePage.css';

import { API_URL } from './settings';
import { ajax } from './api';

function fetchSnapshots() {
  return ajax.get('snapshots');
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
    fetchSnapshots().then(data => {
      console.log('data:', data)
      setSnapshots(data);
    });
  }, []);

  return (
    <div className='home-page-container'>
      <header>
        <h1>Frac Vizzy Home Page</h1>
        <div className='link-bar'>
          <a href='/login'>Login</a>
          <a href='/explore'>Explore</a>
          <div style={{marginLeft: '30px'}}>
            Current User: <span>{currentUser || '<Anonymous>'}</span>
          </div>
        </div>
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
