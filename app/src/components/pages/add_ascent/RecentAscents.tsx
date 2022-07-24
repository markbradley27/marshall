import { AscentState, fetchAscents } from "api/ascent_endpoints";
import AscentList from "components/shared/ascent/AscentList";
import { useAuth } from "contexts/auth";
import { useCallback, useEffect, useState } from "react";

const API_PAGE_LENGTH = 20;

interface AscentsState {
  ascents: Array<AscentState | undefined>;
  count: number;
}

export default function RecentAscents() {
  const auth = useAuth();

  const [ascentsState, setAscentsState] = useState<AscentsState | null>(null);

  useEffect(() => {
    const fetchInitialAscents = async () => {
      setAscentsState(
        await fetchAscents({
          idToken: (await auth.users?.fb?.getIdToken()) as string,
          userId: auth.users?.fb?.uid,
          includeMountains: true,
          page: 0,
        })
      );
    };
    fetchInitialAscents();
  }, [auth.users]);

  const fetchMoreAscents = useCallback(
    async (min: number, max: number) => {
      // TODO: Handle these errors.
      if (
        ascentsState == null ||
        min > ascentsState.count ||
        max > ascentsState.count
      ) {
        return;
      }

      for (
        let page = Math.floor(min / API_PAGE_LENGTH);
        page < Math.ceil(max / API_PAGE_LENGTH);
        ++page
      ) {
        const fetched = await fetchAscents({
          idToken: (await auth.users?.fb?.getIdToken()) as string,
          userId: auth.users?.fb?.uid,
          includeMountains: true,
          page,
        });
        while (ascentsState.ascents.length < page * API_PAGE_LENGTH) {
          ascentsState.ascents.push(undefined);
        }
        const firstFetchedIndex = page * API_PAGE_LENGTH;
        for (let i = 0; i < fetched.ascents.length; ++i) {
          if (ascentsState.ascents.length === firstFetchedIndex + i) {
            ascentsState.ascents.push(fetched.ascents[i]);
          } else {
            ascentsState.ascents[firstFetchedIndex + i] = fetched.ascents[i];
          }
        }
      }
      setAscentsState({
        ascents: ascentsState.ascents,
        count: ascentsState.count,
      });
    },
    [auth.users, ascentsState]
  );

  return (
    <AscentList
      ascents={ascentsState?.ascents || null}
      count={ascentsState?.count || 0}
      fetchMoreAscents={fetchMoreAscents}
      pageLength={5}
    />
  );
}
