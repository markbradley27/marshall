import { apiPostJson, BASE_URL } from "./common";

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

export { postList };
