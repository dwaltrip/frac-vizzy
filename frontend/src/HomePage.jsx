import React, { useEffect, useState } from 'react';

import { ajax } from './api';

function fetchSnapshots() {
  return ajax.get('snapshots');
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
            <li>
              <span>{snapshot.description}</span>
              <a href={snapshot.link} target='_blank'>
                {snapshot.link}
              </a>
            </li>
          ))}
        </ul> :
        <p>no snapshots...</p>
      }
    </div>
  );
}

export { HomePage };
