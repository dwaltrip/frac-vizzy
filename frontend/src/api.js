import { API_URL } from './settings';

class HTTPError extends Error {
  constructor(response) {
    super(`HTTP Error: ${response.status} ${response.statusText}`);
    this.response = response;
  }
}

class NetworkError extends Error {
  constructor(error) {
    super(`Network Error: ${error.message}`);
    this.error = error;
  }
}

export { HTTPError, NetworkError };

// TODO: use some lib for this?
async function doFetch(path, {
  method='GET',
  data=null,
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

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new HTTPError(response);
    }
    return response.json();
  }
  catch (error) {
    if (error instanceof TypeError) {
      throw new NetworkError(error);
    }
    throw error;
  }
}

const request = {
  // TODO: better way to pass in the token??
  async get(path, token) {
    return doFetch(path, token ? { token } : {});
  },
  // get(path) { return doFetch(path); },

  async post(path, data, token=null) {
    return doFetch(path, { method: 'POST', data, token });
  },
}

export { request };
