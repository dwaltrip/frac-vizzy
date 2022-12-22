import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { request } from '../../api';

const initialState = {
  snapshotsForUsers: {},
  entities: {},
};

export const loadSnapshotsForUser = createAsyncThunk(
  'users/loadSnapshotsForUser',
  userId => request.get(`snapshots/?user=${userId}`),
);

// ----------------------------------------------------------------------------

const snapshotsSlice = createSlice({
  name: 'snaphots',
  initialState,

  reducers: {
  },

  extraReducers: builder => {
    (builder
      .addCase(loadSnapshotsForUser.fulfilled, (state, action) => {
        const { snapshots, user } = action.payload;

        for (let snap in snapshots) {
          state.entities[snap.id] = snap;
        }

        const newSnapIds = snapshots.map(snap => snap.id)
        state.snapshotsForUsers[user.id] = mergeIds(
          state.snapshotsForUsers[user.id],
          newSnapIds,
        );
      })
    );
  },
});

// ----------------------------------------------------------------------------

export const selectSnapshots = state => state.snapshots.entities;

export const selectSnapshotById = (state, snapId) => {
  return snapId ? selectSnapshots(state)[snapId] : null;
};

export const selectSnapshotsForUser = (state, userId) => {
  if (!userId) {
    return null;
  }
  return state.snapshotsForUsers[userId].map(id => selectSnapshotById(id));
};

// ----------------------------------------------------------------------------

export const usersReducer = usersSlice.reducer;
