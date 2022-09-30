import { activityApiToState, ActivityState } from "api/activity_endpoints";
import { apiFetchJson, apiPost, BASE_URL } from "api/common";
import { mountainApiToState, MountainState } from "api/mountain_endpoints";

interface AscentState {
  id: number;
  privacy: string;
  date: string;
  time?: string;
  timeZone: string;
  activityId?: number;
  activity?: ActivityState;
  mountainId: number;
  mountain?: MountainState;
  userId: string;
}

function ascentApiToState(apiAscent: any): AscentState {
  return {
    id: apiAscent.id,
    privacy: apiAscent.privacy,
    date: apiAscent.date,
    time: apiAscent.time,
    timeZone: apiAscent.timeZone,
    activityId: apiAscent.activityId,
    activity:
      apiAscent.activity != null
        ? activityApiToState(apiAscent.activity)
        : undefined,
    mountainId: apiAscent.mountainId,
    mountain:
      apiAscent.mountain != null
        ? mountainApiToState(apiAscent.mountain)
        : undefined,
    userId: apiAscent.userId,
  };
}

interface FetchAscentOptions {
  idToken?: string;
  includeMountain?: boolean;
}
async function fetchAscent(id: number, options?: FetchAscentOptions) {
  const url = new URL(`ascent/${id}`, BASE_URL);
  if (options?.includeMountain) {
    url.searchParams.set("includeMountain", "true");
  }
  return await apiFetchJson(url, options?.idToken);
}

interface FetchAscentsOptions {
  idToken?: string;
  ascentId?: number;
  mountainId?: number;
  userId?: string;
  includeMountains?: boolean;
  page?: number;
}
async function fetchAscents(options?: FetchAscentsOptions) {
  const url = new URL("ascents", BASE_URL);
  if (options?.ascentId != null) {
    url.searchParams.set("ascentId", options.ascentId.toString());
  }
  if (options?.mountainId != null) {
    url.searchParams.set("mountainId", options.mountainId.toString());
  }
  if (options?.userId != null) {
    url.searchParams.set("userId", options.userId);
  }
  if (options?.includeMountains) {
    url.searchParams.set("includeMountains", "true");
  }
  if (options?.page) {
    url.searchParams.set("page", options.page.toString());
  }
  const data = await apiFetchJson(url, options?.idToken);
  return {
    ascents: data.ascents.map(ascentApiToState),
    count: data.count,
    page: data.page,
  };
}

async function postAscent(
  idToken: string,
  privacy: string,
  date: string,
  mountainId: number,
  time?: string
) {
  const url = new URL("ascent", BASE_URL);
  url.searchParams.set("privacy", privacy);
  url.searchParams.set("date", date);
  url.searchParams.set("mountainId", mountainId.toString());
  if (time != null) {
    url.searchParams.set("time", time);
  }
  return await apiPost(url, idToken);
}

export type { AscentState };
export { ascentApiToState, fetchAscent, fetchAscents, postAscent };
