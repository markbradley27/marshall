import { Ascent } from "../../model/Ascent";

import { activityModelToApi } from "./activity_api_model";
import { mountainModelToApi } from "./mountain_api_model";
import { userModelToApi } from "./user_api_model";

export function ascentModelToApi(ascent: Ascent): any {
  return {
    id: ascent.id,
    privacy: ascent.privacy,
    date: ascent.date,
    time: ascent.time != null ? ascent.time : undefined,
    timeZone: ascent.timeZone,
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
