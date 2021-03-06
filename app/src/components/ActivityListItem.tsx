import { ActivityState } from "api/activity_endpoints";
import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import Row from "react-bootstrap/Row";

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
        <Col className="text-muted">{props.activity.date.toLocaleString()}</Col>
      </Row>
    </ListGroup.Item>
  );
}
