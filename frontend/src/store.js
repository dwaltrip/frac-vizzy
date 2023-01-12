import { configureStore } from '@reduxjs/toolkit';

import { usersReducer } from 'features/users/usersSlice';
import { snapshotsReducer } from 'features/snapshots/snapshotsSlice';


const ActionLogger = (storeAPI) => (next) => (action) => {
  console.log('Dispatching:', action.type);
  return next(action);
};

const store = configureStore({
  reducer: {
    users: usersReducer,
    snapshots: snapshotsReducer,
  },
  middleware: (getDefaultMiddleware) => (
    getDefaultMiddleware().concat(ActionLogger)
  ),
});

export { store };
