import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import Row from "react-bootstrap/Row";

import { AscentInfo } from "./activity_types";

interface AscentListItemProps {
  ascent: AscentInfo;
}
function AscentListItem(props: AscentListItemProps) {
  return (
    <ListGroup.Item>
      <Row>
        {props.ascent.n && <Col>{props.ascent.n}</Col>}
        {props.ascent.mountain && (
          <Col>
            <a href={"/mountain/" + props.ascent.mountain.id}>
              {props.ascent.mountain.name}
            </a>
          </Col>
        )}
        <Col>
          <a href={"/activity/" + props.ascent.activityId}>
            {props.ascent.date}
          </a>
        </Col>
      </Row>
    </ListGroup.Item>
  );
}

export default AscentListItem;
