import { MountainState } from "api/mountain_endpoints";

import PaginatedList from "../pagination/PaginatedList";

import MountainListItem from "./MountainListItem";

interface MountainListProps {
  mountains: MountainState[];
  // If provided, a checkmark button will be displayed for each mountain and
  // this callback will be fired if it's clicked.
  confirmMountain?: (mountain: MountainState) => void;
  // String to display if mountains is empty.
  emptyPlaceholder?: string;
  // If true, all items in the list (including the empty placholder) will have
  // invalid form styling.
  isInvalid?: boolean;
  // Function that should return a bootstrap list item variant for the given
  // mountain.
  mountainVariant?: (mountain: MountainState) => string;
  // If true, names will be rendered as links to that mountain's page.
  namesAreLinks?: boolean;
  // If provided, sets the number of mountains to display at once via
  // pagination.
  pageLength?: number;
  // If provided, an X button will be displayed for each mountain and this
  // callback will be fired if it's clicked.
  removeMountain?: (mountain: MountainState) => void;
}
export default function MountainList(props: MountainListProps) {
  const { emptyPlaceholder = "Mountains list is empty." } = props;

  return (
    <PaginatedList
      elements={
        props.mountains &&
        props.mountains.map(
          (mountain) =>
            mountain && (
              <MountainListItem
                key={mountain.id}
                isInvalid={props.isInvalid}
                mountain={mountain}
                variant={
                  props.mountainVariant != null
                    ? props.mountainVariant(mountain)
                    : undefined
                }
                namesAreLinks={props.namesAreLinks}
                onConfirm={props.confirmMountain?.bind(null, mountain)}
                onRemove={props.removeMountain?.bind(null, mountain)}
              />
            )
        )
      }
      count={props.mountains.length}
      fetchMoreElements={() => {}}
      pageLength={props.pageLength || props.mountains.length}
      emptyPlaceholder={emptyPlaceholder}
    />
  );
}
