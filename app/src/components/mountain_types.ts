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

  state?: MountainState;
}

export function apiMountainToMountainInfo(apiMountain: any) {
  return {
    id: apiMountain.id,
    name: apiMountain.name,
    coords: new google.maps.LatLng({
      lat: apiMountain.location.coordinates[1],
      lng: apiMountain.location.coordinates[0],
    }),
    wikipediaLink: apiMountain.wikipediaLink,
    abstract: apiMountain.abstract,
  };
}
