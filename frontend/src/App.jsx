import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './styles/App.css';

import { HomePage } from './HomePage';
import { FractalExplorer } from './FractalExplorer';
import { LoginPage } from './LoginPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/explore',
    element: <FractalExplorer />
  },
  {
    path: '/login',
    element: <LoginPage />
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
