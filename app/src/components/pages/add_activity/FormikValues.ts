import { MountainState } from "api/mountain_endpoints";
import { LineString } from "geojson";

export interface Values {
  file: File | null;
  path: LineString | undefined;
  suggested: MountainState[];
  name: string;
  date: string;
  time: string;
  privacy: string;
  description: string;
  ascended: MountainState[];
}
