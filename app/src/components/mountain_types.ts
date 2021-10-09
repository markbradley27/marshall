import { AscentInfo } from "./activity_types";

export enum MountainState {
  NEUTRAL,
  SECONDARY,
  HIGHLIGHTED,
}

export interface MountainInfo {
  id: number;
  name: string;
  coords: google.maps.LatLng;
  wikipediaLink?: string;
  abstract?: string;

  nearby?: MountainInfo[];
  ascents?: AscentInfo[];

  state?: MountainState;
}

export function apiMountainToMountainInfo(apiMountain: any) {
  let nearby =
    apiMountain.nearby != null
      ? apiMountain.nearby.map(apiMountainToMountainInfo)
      : undefined;
  return {
    id: apiMountain.id,
    name: apiMountain.name,
    coords: new google.maps.LatLng({
      lat: apiMountain.location.coordinates[1],
      lng: apiMountain.location.coordinates[0],
    }),
    wikipediaLink: apiMountain.wikipediaLink,
    abstract: apiMountain.abstract,
    nearby: nearby,
    ascents: apiMountain.ascents,
  };
}
