import { ascentApiToState, AscentState } from "api/ascent_endpoints";
import { apiFetch, BASE_URL } from "api/common";
import { Point } from "geojson";

interface MountainState {
  id: number;
  source?: string;
  sourceId?: string;
  name: string;
  location: Point;
  timeZone: string;
  wikipediaLink?: string;
  abstract?: string;

  ascents?: AscentState[];
  nearby?: MountainState[];

  distance?: number;
}

function mountainApiToState(apiMountain: any): MountainState {
  return {
    id: apiMountain.id,
    source: apiMountain.source,
    sourceId: apiMountain.sourceId,
    name: apiMountain.name,
    location: apiMountain.location,
    timeZone: apiMountain.timeZone,
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

async function fetchMountains() {
  const url = new URL("mountains", BASE_URL);
  const mountainsJson = await apiFetch(url);
  return mountainsJson.map(mountainApiToState);
}

export type { MountainState };
export { fetchMountain, fetchMountains, mountainApiToState };
