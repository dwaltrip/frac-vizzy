import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './styles/App.css';

import { HomePage } from './HomePage';
import { FractalExplorer } from './FractalExplorer';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
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
