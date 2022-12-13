import { configureStore } from '@reduxjs/toolkit';


const ActionLogger = (storeAPI) => (next) => (action) => {
  console.log('Dispatching:', action.type);
  return next(action);
};

const store = configureStore({
  reducer: {
  },
  middleware: (getDefaultMiddleware) => (
    getDefaultMiddleware().concat(ActionLogger)
  ),
});

export { store };
