const BASE_URL = new URL(
  "http://" +
    process.env.REACT_APP_HOST +
    ":" +
    process.env.REACT_APP_PORT +
    "/api/client/"
);

// Returns the auth header if an idToken is provided, empty object otherwise.
function buildAuthHeader(idToken?: string): any {
  if (idToken != null) {
    return { "id-token": idToken };
  } else {
    return {};
  }
}

// Deserializes a JSON API response, if present.
//
// If the response doesn't have serializable JSON but the status is 200, returns
// an empty object.
//
// If the response includes an error, it will be thrown.
// Otherwise, the data portion of the response is returned.
async function maybeParseJsonResponse(res: Response) {
  let json: any;
  try {
    json = await res.json();
  } catch {
    if (res.status === 200) {
      return {};
    } else {
      const errorStr = `API Error (${res.status}): No JSON error context provided.`;
      console.log(errorStr);
      throw new Error(errorStr);
    }
  }
  if (json.error != null) {
    const errorStr = `API Error ${res.status}): ${json.error}`;
    console.log(errorStr);
    throw new Error(errorStr);
  }
  return json.data;
}

// Fetches the given URL and returns the data response or throws an error.
async function apiFetch(url: URL | string, idToken?: string) {
  const res = await fetch(url.toString(), {
    headers: buildAuthHeader(idToken),
  });
  return maybeParseJsonResponse(res);
}

// Fetches the given URL and returns an object URL pointing to the fetched blob.
async function apiFetchBlob(url: URL | string) {
  const res = await fetch(url.toString());
  if (res.status === 404) {
    return null;
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// Posts to the given URL and returns the data response or throws an error.
async function apiPost(url: URL | string, idToken?: string) {
  const res = await fetch(url.toString(), {
    headers: buildAuthHeader(idToken),
    method: "POST",
  });
  return maybeParseJsonResponse(res);
}

// Posts the given JSON to the given URL and returns the data response or throws
// an error.
async function apiPostJson(url: URL | string, data: any, idToken?: string) {
  const res = await fetch(url.toString(), {
    headers: {
      ...buildAuthHeader(idToken),
      "content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });
  return maybeParseJsonResponse(res);
}

// Puts the given blob to the given URL and returns the data response or throws
// an error.
async function apiPutBlob(
  url: URL | string,
  identifier: string,
  blob: Blob,
  idToken?: string
) {
  const formData = new FormData();
  formData.append(identifier, blob);
  const res = await fetch(url.toString(), {
    headers: buildAuthHeader(idToken),
    method: "PUT",
    body: formData,
  });
  return maybeParseJsonResponse(res);
}

export { apiFetch, apiFetchBlob, apiPost, apiPostJson, apiPutBlob, BASE_URL };
