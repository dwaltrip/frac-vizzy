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

export const loadAllSnapshots = createAsyncThunk(
  'snapshots/loadAllSnapshots', 
  () => request.get('snapshots'),
);

export const loadSnapshotsForUser = createAsyncThunk(
  'snapshots/loadSnapshotsForUser',
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
      .addCase(loadAllSnapshots.fulfilled, (state, action) => {
        for (let snap of action.payload) {
          state.entities[snap.id] = snap;
        }
      })
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

function sortedByDate(snapshots) {
  snapshots.sort((a,b) => a.created_at < b.created_at ? 1 : -1);
  return snapshots;
}

// ----------------------------------------------------------------------------

// TODO: Look into basic / simple perf stuff for all of these selectors.

export const selectSnapshots = state => state.snapshots.entities;

// TODO: look up how to use `createSelector`, memoize this
export const selectAllSnapshots = state => {
  return Object.values(selectSnapshots(state));
};

// TODO: look up how to use `createSelector`, memoize this
export const selectAllSnapshotsOrderedByDate = state => {
  const snaps = selectAllSnapshots(state);
  return sortedByDate(snaps);
};

export const selectSnapshotById = (state, snapId) => {
  return snapId ? selectSnapshots(state)[snapId] : null;
};

// TODO: memoize this??
export const selectSnapshotsForUser = (state, userId) => {
  if (!userId) {
    return null;
  }
  const snaps = (state.snapshots.forUser[userId] || []);
  return sortedByDate(snaps.map(id => selectSnapshotById(state, id)));
};

// ----------------------------------------------------------------------------

export const snapshotsReducer = snapshotsSlice.reducer;
