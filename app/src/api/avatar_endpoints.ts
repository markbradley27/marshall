import { apiFetchBlob, apiPutBlob, BASE_URL } from "api/common";

async function fetchAvatar(id: string) {
  const url = new URL("avatar/" + id, BASE_URL);
  return apiFetchBlob(url);
}

async function putAvatar(idToken: string, avatar: Blob) {
  const url = new URL("avatar", BASE_URL);
  return await apiPutBlob(url, "avatar", avatar, idToken);
}

export { fetchAvatar, putAvatar };
