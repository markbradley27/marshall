import ListGroup from "react-bootstrap/ListGroup";

import { AscentInfo } from "./activity_types";

interface AscentListItemProps {
  ascent: AscentInfo;
}
function AscentListItem(props: AscentListItemProps) {
  return <ListGroup.Item>{props.ascent.mountainName}</ListGroup.Item>;
}

export default AscentListItem;
