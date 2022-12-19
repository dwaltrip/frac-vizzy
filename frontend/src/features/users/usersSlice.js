import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { request } from '../../api';
import { sessionTokenStore } from './sessionTokenStore';

const initialState = {
  currentUser: null,
  token: null,

  entities: {},

  loginErrorMessage: null,
};

export const login = createAsyncThunk(
  'users/login',
  async ({ username, password }) => {
    const response = await request.post(
      'dj-rest-auth/login',
      { username, password },
    );
    const { key: token } = response;
    const user = await request.get('dj-rest-auth/user', token);
    // TODO: We are persisting in local storage.
    // I think a cookie set by the server would be better.
    sessionTokenStore.set(token);
    return { token, user };
  },
);

export const logout = createAsyncThunk('users/logout', async (token) => {
  const resp = await request.post('dj-rest-auth/logout', null, token);
  sessionTokenStore.clear();
  return resp;
});

export const fetchCurrentUser = createAsyncThunk('users/fetchCurrentUser', async () => {
  const token = sessionTokenStore.get();
  if (!token) {
    return Promise.resolve(null);
  }
  // TODO: handle error case where the token is expired!!
  const user = await request.get('dj-rest-auth/user', token);
  // TODO: is Promise.resolve necessary here?
  return Promise.resolve({ token, user });
});

export const loadUserDetails = createAsyncThunk(
  'users/loadUserDetails',
  userId => request.get(`users/${userId}`),
);

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
    (builder
      .addCase(login.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.currentUser = user;
        state.token = token;
        state.loginErrorMessage = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loginErrorMessage = 'Login failed';
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
      .addCase(loadUserDetails.fulfilled, (state, action) => {
        const user = action.payload;
        console.log('loadUserDetails.fulfilled -- user:', user);
        state.entities[user.id] = user;
      })
    );
  },
});

// export const { updateCurrentUser } = usersSlice.actions;

// ----------------------------------------------------------------------------

export const selectCurrentUser = state => state.users.currentUser;

export const selectToken = state => state.users.token;

export const selectUserEntities = state => state.users.entities;

export const selectUserById = (state, userId) => {
  return selectUserEntities(state)[userId];
}

// ----------------------------------------------------------------------------

export const usersReducer = usersSlice.reducer;
