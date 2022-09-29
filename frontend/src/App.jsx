import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './styles/App.css';

import { FractalExplorer } from './FractalExplorer';

const DummyHomePage = () => (
  <h3>Frac Vizzy Home Page</h3>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <DummyHomePage />
  },
  {
    path: '/explore',
    element: <FractalExplorer />
  },
]);

function App() {

  return (
    <div className='App'>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
