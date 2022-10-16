import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    console.log('Home Page -- useEffect -- fetchSnapshots');
    fetchSnapshots().then(data => {
      console.log('data:', data)
      setSnapshots(data);
    });
  }, []);

  return (
    <div className='home-page-container'>
      <h1>Frac Vizzy Home Page</h1>
      <a href='/explore'>Explore</a>
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
