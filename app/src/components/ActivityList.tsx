import { Col, Form, ListGroup, Row } from "react-bootstrap";

import { ActivityState } from "../api_client";

import ActivityListItem from "./ActivityListItem";

interface ActivityListProps {
  title: string;
  activities: ActivityState[];
  onlyActivitiesWithAscents: boolean;
  toggleOnlyActivitiesWithAscents: () => void;
}
export default function ActivityList(props: ActivityListProps) {
  return (
    <Row>
      <Col xs="auto">
        <h3>{props.title}</h3>
      </Col>
      <Col className="ms-auto" xs="auto">
        <Form as={Row}>
          <Form.Label column xs="auto">
            Only show activities with ascents:
          </Form.Label>
          <Col className="ps-0">
            <Form.Check
              checked={props.onlyActivitiesWithAscents}
              className="mt-2"
              onChange={props.toggleOnlyActivitiesWithAscents}
              type="switch"
            />
          </Col>
        </Form>
      </Col>
      <ListGroup>
        {props.activities.map((activity) => {
          return <ActivityListItem key={activity.id} activity={activity} />;
        })}
      </ListGroup>
    </Row>
  );
}
