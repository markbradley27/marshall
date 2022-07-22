import { Activity } from "../../model/Activity";

import { ascentModelToApi } from "./ascent_api_model";
import { userModelToApi } from "./user_api_model";

export function activityModelToApi(activity: Activity): any {
  return {
    id: activity.id,
    source: activity.source,
    sourceId: activity.sourceId,
    name: activity.name,
    date: activity.date,
    timeZone: activity.timeZone,
    path: activity.path,
    description: activity.description,

    ascents: activity.ascents?.map(ascentModelToApi),
    user: activity.user != null ? userModelToApi(activity.user) : undefined,
    userId: activity.userId,
  };
}
