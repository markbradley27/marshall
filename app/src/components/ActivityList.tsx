import { Col, Form, InputGroup, ListGroup, Row } from "react-bootstrap";

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
      <Col>
        <h3>{props.title}</h3>
      </Col>
      <Col>
        {/*
        TODO: Look at bootstrap toggle for this: https://www.bootstraptoggle.com/
        */}
        <Form>
          <InputGroup.Checkbox
            checked={props.onlyActivitiesWithAscents}
            onChange={props.toggleOnlyActivitiesWithAscents}
          />
          Only activities with ascents
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
