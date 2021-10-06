export interface ActivityInfo {
  name: string;
  date: Date;
  path: google.maps.LatLng[];
  bounds: google.maps.LatLngBounds;
  ascents: AscentInfo[];
}

export interface AscentInfo {
  id: number;
  mountainId: number;
  mountainName: string;
  mountainCoords: google.maps.LatLng;
}
