import { API_URL } from './settings';

// TODO: use some lib for this?
function ajax(path) {
  // TODO: do this more robustly
  const url = `${API_URL}/${path}/`;

  // TODO: error handling.
  return fetch(url)
    .then((response) => response.json());
}

export { ajax };
