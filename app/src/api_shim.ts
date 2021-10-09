import toBBox from "geojson-bounding-box";

async function apiFetch(url: string, idToken?: string) {
  let headers: any = {};
  if (idToken != null) {
    headers["id-token"] = idToken;
  }
  return (await fetch(url, { headers })).json();
}

export interface ActivityState {
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

interface ApiFetchActivityOptions {
  idToken: string;
  includeAscents?: boolean;
  includeBounds?: boolean;
}
export async function apiFetchActivity(
  id: number,
  options: ApiFetchActivityOptions
) {
  const activityJson = await apiFetch(
    "/api/client/activities/" +
      id +
      "?include_ascents=" +
      options.includeAscents || "false",
    options.idToken
  );
  return apiActivityToActivityState(activityJson, {
    includeBounds: options.includeBounds || false,
  });
}

export interface AscentState {
  id: number;
  date: Date;

  activityId?: number;
  activity?: ActivityState;
  mountainId?: number;
  mountain?: MountainState;
  userId?: string;

  n?: number;
}

export function apiAscentToAscentState(apiAscent: any): AscentState {
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

export enum MountainUiState {
  NEUTRAL,
  SECONDARY,
  HIGHLIGHTED,
}

export interface MountainState {
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

export function apiMountainToMountainState(apiMountain: any): MountainState {
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

interface ApiFetchMountainOptions {
  idToken?: string;
  includeNearby?: boolean;
  includeAscents?: boolean;
}
export async function apiFetchMountain(
  id: number,
  options: ApiFetchMountainOptions
) {
  const mountainJson = await apiFetch(
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
