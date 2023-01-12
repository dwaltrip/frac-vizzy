import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import 'styles/common/AppHeader.css';

import { selectCurrentUser } from 'features/users/usersSlice';
import { LogoutButton } from 'features/home/pages/home/LogoutButton';

function AppHeader() {
  const currentUser = useSelector(selectCurrentUser);

  return (
    <header className='app-header'>
      <h1 className='app-title'>
        <Link to='/'>Frac Vizzy</Link>
      </h1>

      <nav>
        <div className='links'>
          <Link to='/explore'>Explore</Link>
        </div>
        <div className='user-section'>
          {currentUser ? (
              <>
                <span className='profile-link'>
                  Current User: 
                  <Link to={`/profile/${currentUser.id}`}>
                    {currentUser.username}
                  </Link>
                </span> 
                <LogoutButton />
              </>
            ) : (
              <Link to='login'>Login</Link>
            )
          }
        </div>
      </nav>
    </header>
  );
}

export { AppHeader };
