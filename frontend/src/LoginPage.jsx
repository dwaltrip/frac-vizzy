import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { login, selectCurrentUser } from './features/users/usersSlice';

import './styles/LoginPage.css';

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // TODO: Is this a good way of handling if theuser is already logged in?
  const currentUser = useSelector(selectCurrentUser);
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    };
  }, [currentUser]);

  const [username, changeUsername] = useState('');
  const [password, changePassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    await dispatch(login({ username, password }));
    setIsLoading(false);
    navigate('/');
  }

  return (
    <div className="LoginPage">
      <header className="App-header">
        <h1>
          Login
        </h1>
        {/* TODO: this loading UX is terrible */}
        <div>{isLoading && <h4>Loading...</h4>}</div>
        <div>
        <form onSubmit={onSubmit}>
          <div>
            <input
              onChange={(e) => changeUsername(e.target.value)}
              value={username}
              type={'input'}
              name={'username'}/>
          </div>
          <div>
            <input
              onChange={(e) => changePassword(e.target.value)}
              value={password}
              type={'password'}
              name={'password'}/>
          </div>
          <button type={'submit'}>Submit</button>
        </form>
        </div>
      </header>
    </div>
  );
}

export { LoginPage };
