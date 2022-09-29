import { AscentState } from "api/ascent_endpoints";
import AscentListItem from "components/shared/ascent/AscentListItem";

import PaginatedList from "../pagination/PaginatedList";

interface AscentListProps {
  ascents: Array<AscentState | undefined> | null;
  count: number;
  fetchMoreAscents: (min: number, max: number) => void;
  pageLength: number;
  emptyPlaceholder?: string;
}
export default function AscentList(props: AscentListProps) {
  return (
    <PaginatedList
      elements={
        props.ascents &&
        props.ascents.map(
          (ascent) =>
            ascent && <AscentListItem key={ascent.id} ascent={ascent} />
        )
      }
      count={props.count}
      fetchMoreElements={props.fetchMoreAscents}
      pageLength={props.pageLength}
      emptyPlaceholder={props.emptyPlaceholder}
    />
  );
}
