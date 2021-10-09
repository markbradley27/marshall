import { MountainInfo } from "./mountain_types";

export interface ActivityInfo {
  name: string;
  date: Date;
  source: string;
  sourceId: string;
  path: google.maps.LatLng[];
  bounds: google.maps.LatLngBounds;
  ascents: AscentInfo[];
}

export interface AscentInfo {
  id: number;
  date: Date;
  activityId?: number;
  n?: number;
  mountain?: MountainInfo;
}
