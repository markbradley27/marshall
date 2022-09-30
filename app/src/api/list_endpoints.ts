import { apiFetchJson, apiPostJson, BASE_URL } from "./common";
import { mountainApiToState, MountainState } from "./mountain_endpoints";

interface ListState {
  id: number;
  name: string;
  private: boolean;
  description?: string;
  mountains: MountainState[];
  ownerId: string;
}

function listApiToState(apiList: any): ListState {
  return {
    id: apiList.id,
    name: apiList.name,
    private: apiList.private,
    description: apiList.description,
    mountains: apiList.mountains.map(mountainApiToState),
    ownerId: apiList.ownerId,
  };
}

interface FetchListOptions {
  idToken?: string;
}

async function fetchList(id: number, options?: FetchListOptions) {
  const url = new URL(`list/${id}`, BASE_URL);
  return await apiFetchJson(url, options?.idToken);
}

interface PostListOptions {
  idToken: string;
  name: string;
  isPrivate: boolean;
  description?: string;
  mountainIds: number[];
}

async function postList(options: PostListOptions) {
  const url = new URL("list", BASE_URL);
  return await apiPostJson(
    url,
    {
      name: options.name,
      isPrivate: options.isPrivate,
      description: options.description,
      mountainIds: options.mountainIds,
    },
    options.idToken
  );
}

export type { ListState };
export { fetchList, listApiToState, postList };
