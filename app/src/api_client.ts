import toBBox from "geojson-bounding-box";

const BASE_URL = new URL(
  "http://" +
    process.env.REACT_APP_HOST +
    ":" +
    process.env.REACT_APP_PORT +
    "/api/client/"
);

function buildAuthHeaders(idToken?: string): any {
  if (idToken != null) {
    return { "id-token": idToken };
  } else {
    return {};
  }
}

async function maybeReturnJson(res: any) {
  try {
    const json = await res.json();
    if (json.error != null) {
      console.log(json.error);
    }
    return json.data;
  } catch (error) {
    return;
  }
}

async function apiFetch(url: URL | string, idToken?: string) {
  const res = await fetch(url.toString(), {
    headers: buildAuthHeaders(idToken),
  });
  return maybeReturnJson(res);
}

async function apiFetchBlob(url: URL | string) {
  const res = await fetch(url.toString());
  if (res.status === 404) {
    return null;
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

async function apiPost(url: URL | string, idToken?: string) {
  const res = await fetch(url.toString(), {
    headers: buildAuthHeaders(idToken),
    method: "POST",
  });
  return maybeReturnJson(res);
}

async function apiPostJson(url: URL | string, data: any, idToken?: string) {
  const res = await fetch(url.toString(), {
    headers: Object.assign({}, buildAuthHeaders(idToken), {
      "content-type": "application/json",
    }),
    method: "POST",
    body: JSON.stringify(data),
  });
  return maybeReturnJson(res);
}

async function apiPutBlob(
  url: URL | string,
  identifier: string,
  blob: Blob,
  idToken?: string
) {
  const formData = new FormData();
  formData.append(identifier, blob);
  const res = await fetch(url.toString(), {
    headers: buildAuthHeaders(idToken),
    method: "PUT",
    body: formData,
  });
  return maybeReturnJson(res);
}

interface ActivityState {
  id: number;
  source: string;
  sourceId?: string;
  name: string;
  date: Date;
  path: google.maps.LatLng[];
  description?: string;

  ascents?: AscentState[];
  userId?: number;

  bounds?: google.maps.LatLngBounds;
}

interface ApiActivityToActivityStateOptions {
  includeBounds: boolean;
}
function activityApiToState(
  apiActivity: any,
  options: ApiActivityToActivityStateOptions
): ActivityState {
  const res: ActivityState = {
    id: apiActivity.id,
    source: apiActivity.source,
    sourceId: apiActivity.sourceId,
    name: apiActivity.name,
    date: new Date(apiActivity.date),
    path: apiActivity.path.coordinates.map((coords: any) => {
      return { lat: coords[1], lng: coords[0] };
    }),
    description: apiActivity.description,
    ascents: apiActivity.ascents?.map(ascentApiToState),
    userId: apiActivity.userId,
  };
  if (options.includeBounds) {
    const boundingBox = toBBox(apiActivity.path);
    res.bounds = new google.maps.LatLngBounds(
      { lat: boundingBox[1], lng: boundingBox[0] },
      { lat: boundingBox[3], lng: boundingBox[2] }
    );
  }
  return res;
}

interface FetchActivitiesOptions {
  idToken?: string;
  activityId?: number;
  includeAscents?: boolean;
  onlyWithAscents?: boolean;
  includeBounds?: boolean;
}
async function fetchActivities(options?: FetchActivitiesOptions) {
  const url = new URL("activities", BASE_URL);
  if (options?.activityId != null) {
    url.pathname += "/" + options.activityId.toString();
  }
  if (options?.includeAscents) {
    url.searchParams.set("include_ascents", "true");
  }
  if (options?.onlyWithAscents) {
    url.searchParams.set("only_with_ascents", "true");
  }

  const activitiesJson = await apiFetch(url, options?.idToken);

  if (options?.activityId != null) {
    return activityApiToState(activitiesJson, {
      includeBounds: options.includeBounds || false,
    });
  }
  return activitiesJson.map((activityJson: any) => {
    return activityApiToState(activityJson, {
      includeBounds: options?.includeBounds || false,
    });
  });
}

interface FetchActivityOptions {
  idToken?: string;
  includeAscents?: boolean;
  includeBounds?: boolean;
}
async function fetchActivity(id: number, options?: FetchActivityOptions) {
  const pluralOptions = options as FetchActivitiesOptions;
  pluralOptions.activityId = id;
  return fetchActivities(pluralOptions);
}

interface AscentState {
  id: number;
  date: Date;

  activityId?: number;
  activity?: ActivityState;
  mountainId?: number;
  mountain?: MountainState;
  userId?: string;

  n?: number;
}

function ascentApiToState(apiAscent: any): AscentState {
  return {
    id: apiAscent.id,
    date: new Date(apiAscent.date),
    activityId: apiAscent.activityId,
    activity:
      apiAscent.activity != null
        ? activityApiToState(apiAscent.activity, {
            includeBounds: false,
          })
        : undefined,
    mountainId: apiAscent.mountainId,
    mountain:
      apiAscent.mountain != null
        ? mountainApiToState(apiAscent.mountain)
        : undefined,
    userId: apiAscent.userId,
  };
}

interface FetchAscentsOptions {
  idToken?: string;
  mountainId?: number;
  includeMountains?: boolean;
}
async function fetchAscents(options?: FetchAscentsOptions) {
  const url = new URL("ascents", BASE_URL);
  if (options?.mountainId != null) {
    url.pathname += "/" + options.mountainId.toString();
  }
  if (options?.includeMountains) {
    url.searchParams.set("include_mountains", "true");
  }
  const ascentsJson = await apiFetch(url, options?.idToken);
  return ascentsJson.map(ascentApiToState);
}

async function postAscent(
  idToken: string,
  privacy: string,
  date: string,
  mountainId: number
) {
  const url = new URL("ascent", BASE_URL);
  url.searchParams.set("privacy", privacy);
  url.searchParams.set("date", date);
  url.searchParams.set("mountainId", mountainId.toString());
  return await apiPost(url, idToken);
}

async function fetchAvatar(id: string) {
  const url = new URL("avatar/" + id, BASE_URL);
  return apiFetchBlob(url);
}

async function putAvatar(idToken: string, avatar: Blob) {
  const url = new URL("avatar", BASE_URL);
  return await apiPutBlob(url, "avatar", avatar, idToken);
}

enum MountainUiState {
  NEUTRAL,
  SECONDARY,
  HIGHLIGHTED,
}

interface MountainState {
  id: number;
  source?: string;
  sourceId?: string;
  name: string;
  coords: google.maps.LatLng;
  wikipediaLink?: string;
  abstract?: string;

  ascents?: AscentState[];
  nearby?: MountainState[];

  distance?: number;

  state?: MountainUiState;
}

function mountainApiToState(apiMountain: any): MountainState {
  return {
    id: apiMountain.id,
    source: apiMountain.source,
    sourceId: apiMountain.sourceId,
    name: apiMountain.name,
    coords: new google.maps.LatLng({
      lat: apiMountain.location.coordinates[1],
      lng: apiMountain.location.coordinates[0],
    }),
    wikipediaLink: apiMountain.wikipediaLink,
    abstract: apiMountain.abstract,
    ascents: apiMountain.ascents?.map(ascentApiToState),
    nearby: apiMountain.nearby?.map(mountainApiToState),
    distance: apiMountain.distance,
  };
}

interface FetchMountainOptions {
  idToken?: string;
  includeNearby?: boolean;
  includeAscents?: boolean;
}
async function fetchMountain(id: number, options?: FetchMountainOptions) {
  const url = new URL("mountain/" + id, BASE_URL);
  if (options?.includeNearby) {
    url.searchParams.set("include_nearby", "true");
  }
  if (options?.includeAscents) {
    url.searchParams.set("include_ascents", "true");
  }
  const mountainJson = await apiFetch(url, options?.idToken);
  return mountainApiToState(mountainJson);
}

interface FetchMountainsOptions {
  boundingBox?: string;
}
async function fetchMountains(options?: FetchMountainsOptions) {
  const url = new URL("mountains", BASE_URL);
  if (options?.boundingBox != null) {
    url.searchParams.set("bounding_box", options.boundingBox);
  }
  const mountainsJson = await apiFetch(url);
  return mountainsJson.map(mountainApiToState);
}

interface UserState {
  id: string;
  name: string;
  location: string;
  gender: string;
  bio: string;
  defaultActivityPrivacy: string;
  defaultAscentPrivacy: string;
  stravaAthleteId?: number;
  activityCount?: number;
  ascentCount?: number;
}
function userApiToState(apiUser: any): UserState {
  return {
    id: apiUser.id,
    name: apiUser.name,
    location: apiUser.location,
    gender: apiUser.gender,
    bio: apiUser.bio,
    defaultActivityPrivacy: apiUser.defaultActivityPrivacy,
    defaultAscentPrivacy: apiUser.defaultAscentPrivacy,
    stravaAthleteId: apiUser.stravaAthleteId,
    activityCount: apiUser.activityCount,
    ascentCount: apiUser.ascentCount,
  };
}

interface FetchUserOptions {
  idToken?: string;
}
async function fetchUser(id: string, options?: FetchUserOptions) {
  const url = new URL("user/" + id, BASE_URL);
  const userJson = await apiFetch(url, options?.idToken);
  return userApiToState(userJson);
}

interface PostUserOptions {
  name?: string;
  location?: string;
  gender?: string;
  bio?: string;
  defaultActivityPrivacy?: string;
  defaultAscentPrivacy?: string;
}
async function postUser(
  id: string,
  idToken: string,
  options?: PostUserOptions
) {
  const url = new URL("user/" + id, BASE_URL);
  return await apiPostJson(url, options, idToken);
}

export type { ActivityState, AscentState, MountainState, UserState };
export {
  apiFetch,
  fetchActivities,
  fetchActivity,
  fetchAscents,
  postAscent,
  fetchAvatar,
  putAvatar,
  fetchMountain,
  fetchMountains,
  fetchUser,
  MountainUiState,
  postUser,
};
