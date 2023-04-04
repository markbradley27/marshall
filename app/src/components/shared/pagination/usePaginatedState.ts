import { useCallback, useState } from "react";

const API_PAGE_LENGTH = 20;

interface PaginatedFetchResponse<T> {
  values: Array<T>;
  count: number;
}

export default function usePaginatedState<StateT>(
  fetchFn: (page: number) => Promise<PaginatedFetchResponse<StateT>>
): [
  Array<StateT | undefined> | undefined,
  number | undefined,
  (min: number, max: number) => Promise<void>
] {
  const [state, setState] = useState<{
    values: Array<StateT | undefined> | undefined;
    count: number | undefined;
  }>({ values: undefined, count: undefined });

  const fetchMoreState = useCallback(
    async (min: number, max: number) => {
      if (
        min < 0 ||
        max < 0 ||
        (state.count != null && (min >= state.count || max > state.count))
      ) {
        console.error(
          `fetchMoreState called with bad args; min: ${min}, max: ${max}, count: ${state.count}`
        );
        return;
      }

      for (
        let page = Math.floor(min / API_PAGE_LENGTH);
        page < Math.ceil(max / API_PAGE_LENGTH);
        ++page
      ) {
        const fetched = await fetchFn(page);
        if (state.values == null) {
          state.values = [];
        }
        state.count = fetched.count;

        // If there's a gap between the last previously existing value and the
        // first fetched value, fill it in with undefined's.
        while (state.values.length < page * API_PAGE_LENGTH) {
          state.values.push(undefined);
        }

        // Update or append the fetched values.
        const firstFetchedIndex = page * API_PAGE_LENGTH;
        for (let i = 0; i < fetched.values.length; ++i) {
          if (state.values.length === firstFetchedIndex + i) {
            state.values.push(fetched.values[i]);
          } else {
            state.values[firstFetchedIndex + i] = fetched.values[i];
          }
        }
      }

      setState({
        values: state.values,
        count: state.count,
      });
    },
    [fetchFn, state]
  );

  return [state.values, state.count, fetchMoreState];
}
