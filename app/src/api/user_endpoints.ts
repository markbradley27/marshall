import { apiFetch, apiPostJson, BASE_URL } from "api/common";

interface UserState {
  id: string;
  name: string;
  location: string;
  gender: string;
  bio: string;
  defaultActivityPrivacy: string;
  defaultAscentPrivacy: string;
  stravaAthleteId?: number;
  activityCount?: number;
  ascentCount?: number;
}
function userApiToState(apiUser: any): UserState {
  return {
    id: apiUser.id,
    name: apiUser.name,
    location: apiUser.location,
    gender: apiUser.gender,
    bio: apiUser.bio,
    defaultActivityPrivacy: apiUser.defaultActivityPrivacy,
    defaultAscentPrivacy: apiUser.defaultAscentPrivacy,
    stravaAthleteId: apiUser.stravaAthleteId,
    activityCount: apiUser.activityCount,
    ascentCount: apiUser.ascentCount,
  };
}

interface FetchUserOptions {
  idToken?: string;
}
async function fetchUser(id: string, options?: FetchUserOptions) {
  const url = new URL("user/" + id, BASE_URL);
  const userJson = await apiFetch(url, options?.idToken);
  return userApiToState(userJson);
}

interface PostUserOptions {
  name?: string;
  location?: string;
  gender?: string;
  bio?: string;
  defaultActivityPrivacy?: string;
  defaultAscentPrivacy?: string;
}
async function postUser(
  id: string,
  idToken: string,
  options?: PostUserOptions
) {
  const url = new URL("user/" + id, BASE_URL);
  return await apiPostJson(url, options, idToken);
}

export type { UserState };
export { fetchUser, postUser };
