import React, { useEffect, useState } from 'react';

import { API_URL } from './settings';
import { ajax } from './api';

function fetchSnapshots() {
  return ajax.get('snapshots');
}

function snapshotImgUrl(shapshot) {
  return `${API_URL}/media/${shapshot.thumbnail_filename}`;
}

function HomePage() {
  const [snapshots, setSnapshots] = useState(null);

  useEffect(() => {
    console.log('Home Page -- useEffect -- fetchSnapshots');
    fetchSnapshots().then(data => setSnapshots(data));
  }, []);

  return (
    <div>
      <h1>Frac Vizzy Home Page</h1>
      {snapshots ? 
        <ul>
          {snapshots.map(snapshot => (
            <li key={snapshot.id}>
              <a href={snapshot.link} target='_blank'>
                {snapshot.description}
              </a>
              <img
                src={snapshotImgUrl(snapshot)}
                width='300'
              />
            </li>
          ))}
        </ul> :
        <p>no snapshots...</p>
      }
    </div>
  );
}

export { HomePage };
