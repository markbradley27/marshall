import { ascentApiToState, AscentState } from "api/ascent_endpoints";
import { apiFetch, apiPostJson, BASE_URL } from "api/common";
import { LineString } from "geojson";
import toBBox from "geojson-bounding-box";

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

interface PostActivityOptions {
  idToken: string;
  privacy: string;
  name: string;
  date: string;
  time?: string;
  timeZone: string;
  path?: LineString;
  description?: string;
  ascendedMountainIds: number[];
}
async function postActivity(options: PostActivityOptions) {
  const url = new URL("activity", BASE_URL);
  return await apiPostJson(
    url,
    {
      privacy: options.privacy,
      source: "WEB_APP_UPLOAD",
      name: options.name,
      date: options.date,
      time: options.time,
      timeZone: options.timeZone,
      path: options.path,
      description: options.description,
      ascendedMountainIds: options.ascendedMountainIds,
    },
    options.idToken
  );
}

export type { ActivityState };
export { activityApiToState, fetchActivities, fetchActivity, postActivity };
