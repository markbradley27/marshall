import ListGroup from "react-bootstrap/ListGroup";

import { MountainInfo } from "./mountain_types";

interface MountainListItemProps {
  mountain: MountainInfo;
}

export default function MountainListItem(props: MountainListItemProps) {
  return (
    <ListGroup.Item>
      <a href={"/mountain/" + props.mountain.id}>{props.mountain.name}</a>
    </ListGroup.Item>
  );
}
