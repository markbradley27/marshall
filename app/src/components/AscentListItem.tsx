import ListGroup from "react-bootstrap/ListGroup";

import { AscentInfo } from "./activity_types";

interface AscentListItemProps {
  ascent: AscentInfo;
}
function AscentListItem(props: AscentListItemProps) {
  return (
    <ListGroup.Item>
      {props.ascent.n}:
      <a href={"/mountain/" + props.ascent.mountain.id}>
        {props.ascent.mountain.name}
      </a>
    </ListGroup.Item>
  );
}

export default AscentListItem;
