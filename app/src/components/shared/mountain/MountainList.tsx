import { MountainState } from "api/mountain_endpoints";
import { ListGroup } from "react-bootstrap";

import MountainListItem from "./MountainListItem";

interface MountainListProps {
  mountains: MountainState[];
  confirmMountain?: (mountain: MountainState) => void;
  emptyPlaceholder?: string;
  mountainVariant?: (mountain: MountainState) => string;
  namesAreLinks?: boolean;
  removeMountain?: (mountain: MountainState) => void;
}
export default function MountainList(props: MountainListProps) {
  const { emptyPlaceholder = "Mountains list is empty." } = props;

  return (
    // TODO: Upgrade react-bootstrap and make this numbered.
    <ListGroup>
      {props.mountains.length !== 0 ? (
        props.mountains.map((mountain) => (
          <MountainListItem
            key={mountain.id}
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
        ))
      ) : (
        <ListGroup.Item className={"text-center"} disabled>
          {emptyPlaceholder}
        </ListGroup.Item>
      )}
    </ListGroup>
  );
}
