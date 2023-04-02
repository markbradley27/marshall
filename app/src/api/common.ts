const BASE_URL = new URL("/api/client/", window.location.href);

// Returns the auth header if an idToken is provided, empty object otherwise.
function buildAuthHeader(idToken?: string): any {
  if (idToken != null) {
    return { "id-token": idToken };
  } else {
    return {};
  }
}

// Deserializes a JSON API response, if present.
async function maybeParseJsonResponse(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// Internal fetch method all other methods should use to hit API endpoints.
//
// Throws an error if the response is ever not 200.
async function apiFetchInternal(
  url: URL | string,
  options?: any
): Promise<Response> {
  const res = await fetch(url.toString(), options);
  if (res.status !== 200) {
    throw new Error(`API fetch failed: ${res.status} ${res.statusText}`);
  }
  return res;
}

// Fetches the given URL and returns the JSON response if present.
//
// Throws error if response is not 200.
async function apiFetch(url: URL | string, idToken?: string) {
  const res = await apiFetchInternal(url.toString(), {
    headers: buildAuthHeader(idToken),
  });
  return maybeParseJsonResponse(res);
}

// Fetches the given URL and returns the JSON response.
//
// Throws error if response is not JSON.
async function apiFetchJson(url: URL | string, idToken?: string) {
  const res = await apiFetchInternal(url.toString(), {
    headers: buildAuthHeader(idToken),
  });
  return res.json();
}

// Fetches the given URL and returns an object URL pointing to the fetched blob.
async function apiFetchBlob(url: URL | string) {
  const res = await apiFetchInternal(url.toString());
  if (res.status === 404) {
    return null;
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// Posts to the given URL and returns the JSON data response if present.
async function apiPost(url: URL | string, idToken?: string) {
  const res = await apiFetchInternal(url.toString(), {
    headers: buildAuthHeader(idToken),
    method: "POST",
  });
  return maybeParseJsonResponse(res);
}

// Posts the given JSON to the given URL and returns the JSON data response if
// present.
async function apiPostJson(url: URL | string, data: any, idToken?: string) {
  const res = await apiFetchInternal(url.toString(), {
    headers: {
      ...buildAuthHeader(idToken),
      "content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });
  return maybeParseJsonResponse(res);
}

// Puts the given blob to the given URL and returns the JSON data response if
// present.
async function apiPutBlob(
  url: URL | string,
  identifier: string,
  blob: Blob,
  idToken?: string
) {
  const formData = new FormData();
  formData.append(identifier, blob);
  const res = await apiFetchInternal(url.toString(), {
    headers: buildAuthHeader(idToken),
    method: "PUT",
    body: formData,
  });
  return maybeParseJsonResponse(res);
}

export {
  apiFetch,
  apiFetchJson,
  apiFetchBlob,
  apiPost,
  apiPostJson,
  apiPutBlob,
  BASE_URL,
};
