import { List } from "../../model/List";

import { mountainModelToApi } from "./mountain_api_model";

export function listModelToApi(list: List): any {
  return {
    id: list.id,
    name: list.name,
    privacy: list.privacy,
    description: list.description,
    mountains: list.mountains?.map(mountainModelToApi),
    ownerId: list.ownerId,
  };
}
