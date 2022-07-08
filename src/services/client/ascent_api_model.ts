import { Ascent } from "../../model/Ascent";

import { activityModelToApi } from "./activity_api_model";
import { mountainModelToApi } from "./mountain_api_model";
import { userModelToApi } from "./user_api_model";

export function ascentModelToApi(ascent: Ascent): any {
  let dateStr = ascent.date.toISOString();
  if (ascent.dateOnly) {
    dateStr = dateStr.split("T")[0];
  }

  return {
    id: ascent.id,
    privacy: ascent.privacy,
    date: dateStr,
    activity:
      ascent.activity != null ? activityModelToApi(ascent.activity) : undefined,
    activityId: ascent.activityId,
    mountain:
      ascent.mountain != null ? mountainModelToApi(ascent.mountain) : undefined,
    mountainId: ascent.mountainId,
    user: ascent.user != null ? userModelToApi(ascent.user) : undefined,
    userId: ascent.userId,
  };
}
