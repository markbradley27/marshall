import { maybeGeometry } from "pure-geojson-validation";

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
    // If the Mountain was retrieved using TypeORM's getRaw* then
    // mountain.location might be a GeoJSON string rather than a GeoJSON object.
    // Passing it to maybeGeometry handles both cases and always spits out an
    // object.
    location: maybeGeometry(mountain.location),
    timeZone: mountain.timeZone,
    wikipediaLink: mountain.wikipediaLink,
    abstract: mountain.abstract,
    ascents: mountain.ascents?.map(ascentModelToApi),
    distance: mountain.distance,
  };
}
