import { API_URL } from './settings';

// TODO: use some lib for this?
function doFetch(path, {
  method='GET',
  data=null,
  // ---------------------------------
  // TODO: How do I pass this.......??
  // ---------------------------------
  token=null,
}={}) {
  // TODO: do this more robustly
  const url = `${API_URL}/${path}/`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // https://www.django-rest-framework.org/api-guide/authentication/#tokenauthentication
      // Unauthenticated responses that are denied permission will result in
      //   an HTTP 401 Unauthorized response.
      ...(token ? { 'Authorization': `Token ${token}` } : null),
    }
  };

  if (method !== 'GET' && data) {
    options.body = JSON.stringify(data);
  }

  // TODO: error handling.
  return fetch(url, options)
    .then((response) => response.json());
}

const ajax = {
  get(path) {
    return doFetch(path);
  },

  post(path, data) {
    return doFetch(path, { method: 'POST', data });
  },
}

export { ajax };
