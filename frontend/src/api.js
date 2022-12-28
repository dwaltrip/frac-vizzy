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


async function doFetch(path, {
  method='GET',
  query=null,
  data=null,
  token=null,
}={}) {
  // TODO: construct the base url more robustly
  const url = buildURL(`${API_URL}/${path}/`, query);

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

  if (method === 'GET' && data) {
    throw new Error('Cannot pass data in a GET request');
  }
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
  async get(path, { query, token }={}) {
    return doFetch(path, { query, token });
  },

  async post(path, data, { token }={}) {
    return doFetch(path, { method: 'POST', data, token });
  },
}

function buildURL(baseURL, queryParams) {
  const url = new URL(baseURL);
  if (queryParams) {
    const searchParams = new URLSearchParams(queryParams);
    url.search = searchParams;
  }
  return url.toString();
}

export { request };
