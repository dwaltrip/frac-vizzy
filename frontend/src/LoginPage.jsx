import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { login } from './features/users/usersSlice';

import './styles/LoginPage.css';

function LoginPage() {
  const dispatch = useDispatch();
  const [username, changeUsername] = useState('');
  const [password, changePassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    await dispatch(login({ username, password }));
    setIsLoading(false);
  }

  return (
    <div className="LoginPage">
      <header className="App-header">
        <h1>
          Login
        </h1>
        <div className={'help-text'}>
          Inspect the network requests in your browser to view headers returned by dj-rest-auth.
        </div>
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
