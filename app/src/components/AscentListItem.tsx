import ListGroup from "react-bootstrap/ListGroup";

import { AscentInfo } from "./activity_types";

interface AscentListItemProps {
  ascent: AscentInfo;
}
function AscentListItem(props: AscentListItemProps) {
  return (
    <ListGroup.Item>
      <a href={"/mountain/" + props.ascent.mountainId}>
        {props.ascent.mountainName}
      </a>
    </ListGroup.Item>
  );
}

export default AscentListItem;
