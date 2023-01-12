import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import 'styles/App.css';

import { fetchCurrentUser } from 'features/users/usersSlice';

import { HomePage } from 'features/home/pages/home/HomePage';
import { FractalExplorer } from 'features/explorer/pages/fractal-explorer/FractalExplorer';
import { LoginPage } from 'features/users/pages/login/LoginPage';
import { ProfilePage } from 'features/users/pages/profile/ProfilePage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: 'explore',
    element: <FractalExplorer />
  },
  {
    path: 'profile/:userId',
    element: <ProfilePage />,
  },
  {
    path: 'login',
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
