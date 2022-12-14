import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './styles/App.css';

import { fetchCurrentUser } from './features/users/usersSlice';

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
  const dispatch = useDispatch();

  useEffect(() => { dispatch(fetchCurrentUser()); }, []);

  return (
    <div className='App'>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
