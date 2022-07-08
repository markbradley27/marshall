import { User } from "../../model/User";

interface UserPlus extends User {
  activityCount?: number;
  ascentCount?: number;
}
export function userModelToApi(user: UserPlus): any {
  return {
    id: user.id,
    name: user.name,
    location: user.location,
    gender: user.gender,
    bio: user.bio,
    defaultActivityPrivacy: user.defaultActivityPrivacy,
    defaultAscentPrivacy: user.defaultAscentPrivacy,
    stravaAthleteId:
      user.stravaAthleteId != null ? user.stravaAthleteId : undefined,
    activityCount: user.activityCount,
    ascentCount: user.ascentCount,
  };
}
