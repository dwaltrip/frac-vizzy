import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { ajax } from '../../api';
import { sessionTokenStore } from './sessionTokenStore';

const initialState = {
  currentUser: null,
  token: null,
};

// ----------------------------------------------------------------------------

export const login = createAsyncThunk('users/login', async ({ username, password }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { key: token } = await ajax.post(
        'dj-rest-auth/login',
        { username, password },
      );
      const user = await ajax.get('dj-rest-auth/user', token);
      // TODO: We are persisting in local storage.
      // I think a cookie set by the server would be better.
      sessionTokenStore.set(token);
      resolve({ token, user });
    }
    catch (error) {
      console.error('login error:', error);
    }
  });
});

export const logout = createAsyncThunk('users/logout', async (token) => {
  const resp = await ajax.post('dj-rest-auth/logout', null, token);
  sessionTokenStore.clear();
  return resp;
});

export const fetchCurrentUser = createAsyncThunk('users/fetchCurrentUser', async () => {
  const token = sessionTokenStore.get();
  if (!token) {
    return Promise.resolve(null);
  }
  // TODO: handle error case where the token is expired!!
  const user = await ajax.get('dj-rest-auth/user', token);
  // TODO: is Promise.resolve necessary here?
  return Promise.resolve({ token, user });
});

// ----------------------------------------------------------------------------

const usersSlice = createSlice({
  name: 'users',
  initialState,

  reducers: {
    // updateCurrentUser(state, action) {
    //   state.currentUser = action.payload;
    // },
  },

  extraReducers: builder => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.currentUser = user;
        state.token = token;
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.currentUser = null;
        state.token = null;
      })
      // TODO: This is very similar to the `login.fulfilled` case. Can we simplify?
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        const { token, user } = action.payload || { token: null, user: null };
        state.currentUser = user;
        state.token = token;
      })
    ;
  },
});

// export const { updateCurrentUser } = usersSlice.actions;

// ----------------------------------------------------------------------------

export const selectCurrentUser = state => state.users.currentUser;

export const selectToken = state => state.users.token;

// ----------------------------------------------------------------------------

export const usersReducer = usersSlice.reducer;
