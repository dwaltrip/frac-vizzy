import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { request } from 'api';
import { sessionTokenStore } from 'features/users/sessionTokenStore';

const initialState = {
  currentUserId: null,

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
    const user = await request._getUsingToken('dj-rest-auth/user', { token });
    // TODO: We are persisting in local storage.
    // I think a cookie set by the server would be better.
    sessionTokenStore.set(token);
    return { user };
  },
);

export const logout = createAsyncThunk('users/logout', async () => {
  const resp = await request.post('dj-rest-auth/logout', null);
  sessionTokenStore.clear();
  return resp;
});

export const fetchCurrentUser = createAsyncThunk('users/fetchCurrentUser', async () => {
  // TODO: handle error case where the token is expired!!
  const user = await request.get('dj-rest-auth/user');
  return { user };
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
    updateUsers(state, action) {
      _updateUsers(state, action.payload);
    },
  },

  extraReducers: builder => {
    (builder
      .addCase(login.fulfilled, (state, action) => {
        setCurrentUser(state, action.payload);
        state.loginErrorMessage = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loginErrorMessage = 'Login failed';
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.currentUserId = null;
      })
      // TODO: This is very similar to the `login.fulfilled` case. Can we simplify?
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        setCurrentUser(state, action.payload);
      })
      .addCase(loadUserDetails.fulfilled, (state, action) => {
        const user = action.payload;
        state.entities[user.id] = user;
      })
    );
  },
});

// export const { updateCurrentUser } = usersSlice.actions;

// ----------------------------------------------------------------------------

function setCurrentUser(state, payload) {
  const user = payload.user || null;

  if (!user) {
    state.currentUserId = null;
  }
  else {
    state.currentUserId = user.id;
    state.entities[user.id] = user;
  }
}

// TODO: RTK has built-in stuff for this, switch to using that.
function _updateUsers(state, users) {
  for (let user of users) {
    state.entities[user.id] = user;
  }
}

// ----------------------------------------------------------------------------

export const { updateUsers } = usersSlice.actions;

// ----------------------------------------------------------------------------

export const selectUserEntities = state => state.users.entities;

export const selectUserById = (state, userId) => {
  return userId ? selectUserEntities(state)[userId] : null;
};

export const selectCurrentUser = state => {
  return selectUserById(state, state.users.currentUserId);
};

// ----------------------------------------------------------------------------

export const usersReducer = usersSlice.reducer;
