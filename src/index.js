import React from 'react';
import ReactDOM from 'react-dom';

import './styles/index.css';
import { initPosthog } from './posthog';
import App from './App';


initPosthog();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
