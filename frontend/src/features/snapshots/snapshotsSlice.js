import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { request } from 'api';

import { updateUsers, selectUserEntities } from 'features/users/usersSlice';

const initialState = {
  forUser: {},
  entities: {},
};

export const loadAllSnapshots = createAsyncThunk(
  'snapshots/loadAllSnapshots', 
  async (_, { dispatch }) => {
    // NOTE: could possibly abstract this logic with a helper, as we are
    // doing the same data extraction here and in `loadSnapshotsForUser`.
    // Something like: extractSnapsAndAuthors
    const {
      data: snapshots,
      sideload: { users },
    } = await request.get('snapshots');
    dispatch(updateUsers(users));
    return snapshots;
  },
);

export const loadSnapshotsForUser = createAsyncThunk(
  'snapshots/loadSnapshotsForUser',
  async (userId, { dispatch }) => {
    const {
      data: snapshots,
      sideload: { users },
    } = await request.get('snapshots', { query: { author_id: userId } });
    dispatch(updateUsers(users));
    return { snapshots, userId };
  },
);

export const loadSnapDetails = createAsyncThunk(
  'snapshots/loadSnapDetails',
  async (id, { dispatch }) => {
    const {
      data: snap,
      sideload: { users },
    } = await request.get(`snapshots/${id}`);
    dispatch(updateUsers(users));
    return snap;
  },
);

export const likeSnapshot = createAsyncThunk(
  'snapshots/likeSnapshot',
  async ({ snap, token }) => {
    // TODO: I shouldn't have to pass the token here..
    // It should happen automatically for all API calls
    const {
      data: updatedSnap,
    } = await request.post(`snapshots/${snap.id}/like`, null, { token });
    return updatedSnap;
  },
);

export const unlikeSnapshot = createAsyncThunk(
  'snapshots/unlikeSnapshot',
  async ({ snap, token }) => {
    const {
      data: updatedSnap
    } = await request.post(`snapshots/${snap.id}/unlike`, null, { token });
    return updatedSnap;
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
          state.forUser[userId] || [],
          newSnapIds,
        );
      })

      .addCase(loadSnapDetails.fulfilled, (state, action) => {
        // TODO: update state.forUser ????
        const snap = action.payload;
        state.entities[snap.id] = snap;
      })

      .addCase(likeSnapshot.fulfilled, (state, action) => {
        const snap = action.payload
        state.entities[snap.id] = snap;
      })

      .addCase(unlikeSnapshot.fulfilled, (state, action) => {
        const snap = action.payload
        state.entities[snap.id] = snap;
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

export const selectSnapshotEntities = state => state.snapshots.entities;

export const selectSnapshots = createSelector(
  selectSnapshotEntities,
  entities => Object.values(entities),
);

export const selectSnapshotEntitiesWithAuthors = createSelector(
  [selectSnapshots, selectUserEntities],
  (snapshots, userEntities) => (
    snapshots.reduce((memo, snap) => {
      memo[snap.id] = { ...snap, author: userEntities[snap.author] };
      return memo;
    }, {})
  ),
);

export const selectSnapshotsWithAuthors = createSelector(
  selectSnapshotEntitiesWithAuthors,
  entitiesWithAuthors => Object.values(entitiesWithAuthors),
);

export const selectSnapshotsWithAuthorsOrderedByDate = createSelector(
  selectSnapshotsWithAuthors,
  snaps => sortedByDate(snaps),
);

export const selectSnapshotWithAuthorById = (state, snapId) => {
  if (!snapId) {
    return null;
  }
  return selectSnapshotEntitiesWithAuthors(state)[snapId];
};

const selectSnapshotIdsForUser = (state, userId) => {
  if (!userId) {
    return null;
  }
  return state.snapshots.forUser[userId] || [];
}

// TODO: Possibly turn this into a selector factory.
// Right now, it isn't an issue as we aren't calling with different args.
export const selectSnapshotsForUser = createSelector(
  [
    selectSnapshotIdsForUser,
    selectSnapshotEntitiesWithAuthors,
    (state, userId) => userId,
  ],
  (snapIds, snapshotEntities, userId) => {
    if (!userId) {
      return null;
    }
    return sortedByDate(snapIds.map(id => snapshotEntities[id]));
  }
);

// Snapshots with `author` and `liked_by` populated
export const selectSnapshotWithDetails = (state, snapId) => {
  if (!snapId) {
    return null;
  }
  const snap = selectSnapshotEntitiesWithAuthors(state)[snapId];
  if (!snap) {
    return null;
  }

  const userEntities = selectUserEntities(state);
  const liked_by = (snap.liked_by || []).map(userId => userEntities[userId]);
  return { ...snap, liked_by };
};

// ----------------------------------------------------------------------------

export const snapshotsReducer = snapshotsSlice.reducer;
