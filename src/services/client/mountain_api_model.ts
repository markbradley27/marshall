import { find as findTz } from "geo-tz";

import { Mountain } from "../../model/Mountain";

import { ascentModelToApi } from "./ascent_api_model";

interface MountainPlus extends Mountain {
  distance?: number;
}
export function mountainModelToApi(mountain: MountainPlus): any {
  return {
    id: mountain.id,
    source: mountain.source,
    sourceId: mountain.sourceId,
    name: mountain.name,
    location: mountain.location,
    timezone: findTz(
      mountain.location.coordinates[1],
      mountain.location.coordinates[0]
    )[0],
    wikipediaLink: mountain.wikipediaLink,
    abstract: mountain.abstract,
    ascents: mountain.ascents?.map(ascentModelToApi),
    distance: mountain.distance,
  };
}
