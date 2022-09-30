import { ascentApiToState, AscentState } from "api/ascent_endpoints";
import { apiFetchJson, apiPostJson, BASE_URL } from "api/common";
import { LineString } from "geojson";

interface ActivityState {
  id: number;
  source: string;
  sourceId?: string;
  name: string;
  date: Date;
  path: LineString;
  description?: string;
  ascents?: AscentState[];
  userId?: number;
}

function activityApiToState(apiActivity: any): ActivityState {
  return {
    id: apiActivity.id,
    source: apiActivity.source,
    sourceId: apiActivity.sourceId,
    name: apiActivity.name,
    date: new Date(apiActivity.date),
    path: apiActivity.path,
    description: apiActivity.description,
    ascents: apiActivity.ascents?.map(ascentApiToState),
    userId: apiActivity.userId,
  };
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

  const activitiesJson = await apiFetchJson(url, options?.idToken);

  if (options?.activityId != null) {
    return activityApiToState(activitiesJson);
  }
  return activitiesJson.map((activityJson: any) => {
    return activityApiToState(activityJson);
  });
}

interface FetchActivityOptions {
  idToken?: string;
  includeAscents?: boolean;
}
async function fetchActivity(id: number, options?: FetchActivityOptions) {
  const url = new URL(`activity/${id}`, BASE_URL);
  if (options?.includeAscents) {
    url.searchParams.set("includeAscents", "true");
  }
  return await apiFetchJson(url, options?.idToken);
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
