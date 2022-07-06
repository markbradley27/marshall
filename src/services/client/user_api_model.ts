import { User } from "../../model/User";

interface UserPlus extends User {
  activityCount?: number;
  ascentCount?: number;
}
export function userModelToApi(user: UserPlus): any {
  return {
    id: user.id,
    name: user.name,
    stravaAthleteId:
      user.stravaAthleteId != null ? user.stravaAthleteId : undefined,
    activityCount: user.activityCount,
    ascentCount: user.ascentCount,
  };
}
