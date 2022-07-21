import { MountainState } from "api/mountain_endpoints";
import ListGroup from "react-bootstrap/ListGroup";

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
