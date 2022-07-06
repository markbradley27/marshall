import { List } from "../../model/List";

import { mountainModelToApi } from "./mountain_api_model";
import { userModelToApi } from "./user_api_model";

export function listModelToApi(list: List): any {
  return {
    id: list.id,
    name: list.name,
    private: list.private,
    mountains: list.mountains?.map(mountainModelToApi),
    owner: list.owner != null ? userModelToApi(list.owner) : undefined,
    ownerId: list.ownerId,
  };
}
