import toBBox from "geojson-bounding-box";

async function apiFetch(url: string, idToken?: string) {
  let headers: any = {};
  if (idToken != null) {
    headers["id-token"] = idToken;
  }
  return await fetch(url, { headers });
}

async function apiFetchJson(url: string, idToken?: string) {
  return (await apiFetch(url, idToken)).json();
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
function apiActivityToActivityState(
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
    ascents: apiActivity.ascents?.map(apiAscentToAscentState),
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
  idToken: string;
  activityId?: number;
  includeAscents?: boolean;
  onlyWithAscents?: boolean;
  includeBounds?: boolean;
}
async function fetchActivities(options: FetchActivitiesOptions) {
  let url = "/api/client/activities";
  if (options.activityId != null) {
    url += "/" + options.activityId.toString();
  }
  const query: any = {};
  if (options.includeAscents) {
    query.include_ascents = true;
  }
  if (options.onlyWithAscents) {
    query.only_with_ascents = true;
  }
  if (Object.keys(query).length) {
    url +=
      "?" +
      Object.entries(query)
        .map((entry: any) => {
          return entry.join("=");
        })
        .join("&");
  }

  const activitiesJson = await apiFetchJson(url, options.idToken);

  if (options.activityId != null) {
    return apiActivityToActivityState(activitiesJson, {
      includeBounds: options.includeBounds || false,
    });
  }
  return activitiesJson.map((activityJson: any) => {
    return apiActivityToActivityState(activityJson, {
      includeBounds: options.includeBounds || false,
    });
  });
}

interface FetchActivityOptions {
  idToken: string;
  includeAscents?: boolean;
  includeBounds?: boolean;
}
async function fetchActivity(id: number, options: FetchActivityOptions) {
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

function apiAscentToAscentState(apiAscent: any): AscentState {
  return {
    id: apiAscent.id,
    date: new Date(apiAscent.date),
    activityId: apiAscent.activityId,
    activity:
      apiAscent.activity != null
        ? apiActivityToActivityState(apiAscent.activity, {
            includeBounds: false,
          })
        : undefined,
    mountainId: apiAscent.mountainId,
    mountain:
      apiAscent.mountain != null
        ? apiMountainToMountainState(apiAscent.mountain)
        : undefined,
    userId: apiAscent.userId,
  };
}

interface FetchAscentsOptions {
  idToken: string;
  mountainId?: number;
  includeMountains?: boolean;
}
async function fetchAscents(options: FetchAscentsOptions) {
  let url = "/api/client/ascents";
  if (options.mountainId != null) {
    url += "/" + options.mountainId.toString();
  }
  if (options.includeMountains) {
    url += "?include_mountains=true";
  }
  const ascentsJson = await apiFetchJson(url, options.idToken);
  return ascentsJson.map(apiAscentToAscentState);
}

enum MountainUiState {
  NEUTRAL,
  SECONDARY,
  HIGHLIGHTED,
}

interface MountainState {
  id: number;
  source: string;
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

function apiMountainToMountainState(apiMountain: any): MountainState {
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
    ascents: apiMountain.ascents?.map(apiAscentToAscentState),
    nearby: apiMountain.nearby?.map(apiMountainToMountainState),
    distance: apiMountain.distance,
  };
}

interface FetchMountainOptions {
  idToken?: string;
  includeNearby?: boolean;
  includeAscents?: boolean;
}
async function fetchMountain(id: number, options: FetchMountainOptions) {
  const mountainJson = await apiFetchJson(
    "/api/client/mountains/" +
      id +
      "?include_nearby=" +
      (options.includeNearby || "false") +
      "&include_ascents=" +
      (options.includeAscents || "false"),
    options.idToken
  );
  return apiMountainToMountainState(mountainJson);
}

interface UserState {
  id: string;
  name: string;
  stravaAthleteId?: number;
  activityCount?: number;
  ascentCount?: number;
}
function apiUserToUserState(apiUser: any): UserState {
  return {
    id: apiUser.id,
    name: apiUser.name,
    stravaAthleteId: apiUser.stravaAthleteId,
    activityCount: apiUser.activityCount,
    ascentCount: apiUser.ascentCount,
  };
}

async function fetchUser(id: string, idToken: string) {
  const userJson = await apiFetchJson("/api/client/user/" + id, idToken);
  return apiUserToUserState(userJson);
}

async function postUser(id: string, name: string) {
  await fetch("/api/client/user?id=" + id + "&name=" + name, {
    method: "POST",
  });
}

export type { ActivityState, AscentState, MountainState, UserState };
export {
  apiFetch,
  apiFetchJson,
  fetchActivities,
  fetchActivity,
  fetchAscents,
  fetchMountain,
  fetchUser,
  MountainUiState,
  postUser,
};
