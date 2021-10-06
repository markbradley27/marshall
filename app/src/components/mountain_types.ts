export interface MountainInfo {
  id: number;
  name: string;
  coords: google.maps.LatLng;
  wikipediaLink: string;
  abstract?: string;
  nearby?: MountainInfo[];
}
