import { AscentState, fetchAscents } from "api/ascent_endpoints";
import AscentList from "components/shared/ascent/AscentList";
import usePaginatedState from "components/shared/pagination/usePaginatedState";
import { useAuth } from "contexts/auth";

export default function RecentAscents() {
  const auth = useAuth();

  const [ascents, count, fetchMoreAscents] = usePaginatedState<AscentState>(
    async (page: number) => {
      const resp = await fetchAscents({
        idToken: (await auth.users?.fb?.getIdToken()) as string,
        userId: auth.users?.fb?.uid,
        includeMountains: true,
        page,
      });
      return {
        values: resp.ascents,
        count: resp.count,
      };
    }
  );

  return (
    <AscentList
      ascents={ascents}
      count={count}
      emptyPlaceholder="No ascents yet, get out there!"
      fetchMoreAscents={fetchMoreAscents}
      pageLength={5}
    />
  );
}
