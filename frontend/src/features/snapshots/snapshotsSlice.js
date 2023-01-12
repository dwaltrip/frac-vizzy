import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { request } from 'api';

const initialState = {
  forUser: {},
  entities: {},
};

export const loadSnapshotsForUser = createAsyncThunk(
  'users/loadSnapshotsForUser',
  async userId => {
    const snapshots = await request.get('snapshots', {
      query: { author_id: userId },
    });
    return { snapshots, userId };
  },
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
        const { snapshots, userId } = action.payload;

        for (let snap of snapshots) {
          state.entities[snap.id] = snap;
        }

        const newSnapIds = snapshots.map(snap => snap.id);
        state.forUser[userId] = combineWithoutDupes(
          // TODO: It'd be nice if I could use `selectSnapshotsForUser` here
          state.forUser[userId] || [],
          newSnapIds,
        );
      })
    );
  },
});

// --------------------------------------------------
// TODO: is this fine?? Move somewhere else!!!!!!!!
// --------------------------------------------------
function combineWithoutDupes(array1, array2) {
  const noDupes = new Set(array1);
  array2.forEach(item => noDupes.add(item));
  return Array.from(noDupes);
}

// ----------------------------------------------------------------------------

export const selectSnapshots = state => state.snapshots.entities;

export const selectSnapshotById = (state, snapId) => {
  return snapId ? selectSnapshots(state)[snapId] : null;
};

// TODO: memoize this??
export const selectSnapshotsForUser = (state, userId) => {
  if (!userId) {
    return null;
  }
  const snaps = state.snapshots.forUser[userId];
  return snaps ? snaps.map(id => selectSnapshotById(state, id)) : [];
};

// ----------------------------------------------------------------------------

export const snapshotsReducer = snapshotsSlice.reducer;
