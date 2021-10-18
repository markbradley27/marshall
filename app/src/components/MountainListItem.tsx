import ListGroup from "react-bootstrap/ListGroup";

import { MountainState } from "../api_client";

interface MountainListItemProps {
  mountain: MountainState;
}

export default function MountainListItem(props: MountainListItemProps) {
  return (
    <ListGroup.Item>
      <a href={"/mountain/" + props.mountain.id}>{props.mountain.name}</a>
    </ListGroup.Item>
  );
}
