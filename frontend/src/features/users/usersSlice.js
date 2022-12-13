import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { ajax } from '../../api';

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
      resolve({ token, user });
    }
    catch (error) {
      console.error('login error:', error);
    }
  });
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
      });
  },
});

// export const { updateCurrentUser } = usersSlice.actions;

export const usersReducer = usersSlice.reducer;
