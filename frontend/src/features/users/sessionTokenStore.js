
const LOCAL_STORAGE_KEY = 'frac-vizzy-session-token';

export const sessionTokenStore = {
  get() {
    return window.localStorage.getItem(LOCAL_STORAGE_KEY);
  },

  set(token) {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, token);
  }
};
