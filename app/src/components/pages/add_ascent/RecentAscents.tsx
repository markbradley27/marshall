import { AscentState, fetchAscents } from "api/ascent_endpoints";
import AscentList from "components/shared/ascent/AscentList";
import { useAuth } from "contexts/auth";
import { useCallback, useEffect, useState } from "react";

const API_PAGE_LENGTH = 20;

interface State {
  ascents: Array<AscentState | undefined>;
  count: number;
}

export default function RecentAscents() {
  const auth = useAuth();

  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    const fetchInitialAscents = async () => {
      setState(
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
      if (state == null || min > state.count || max > state.count) {
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
        while (state.ascents.length < page * API_PAGE_LENGTH) {
          state.ascents.push(undefined);
        }
        const firstFetchedIndex = page * API_PAGE_LENGTH;
        for (let i = 0; i < fetched.ascents.length; ++i) {
          if (state.ascents.length === firstFetchedIndex + i) {
            state.ascents.push(fetched.ascents[i]);
          } else {
            state.ascents[firstFetchedIndex + i] = fetched.ascents[i];
          }
        }
      }
      setState({
        ascents: state.ascents,
        count: state.count,
      });
    },
    [auth.users, state]
  );

  return state != null ? (
    <AscentList
      ascents={state.ascents}
      count={state.count}
      fetchMoreAscents={fetchMoreAscents}
      pageLength={5}
    />
  ) : (
    <></>
  );
}
