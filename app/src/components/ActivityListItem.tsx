import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import Row from "react-bootstrap/Row";

import { ActivityState } from "../api_shim";

interface ActivityListItemProps {
  activity: ActivityState;
}
export default function ActivityListItem(props: ActivityListItemProps) {
  return (
    <ListGroup.Item>
      <Row>
        <Col>
          <a href={"/activity/" + props.activity.id}>{props.activity.name}</a>
        </Col>
        <Col>{props.activity.date.toLocaleString()}</Col>
      </Row>
    </ListGroup.Item>
  );
}
