import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

import ActivityListItem from "./ActivityListItem";
import { ActivityState } from "../api_shim";

interface ActivityListProps {
  title: string;
  activities: ActivityState[];
  onlyActivitiesWithAscents: boolean;
  toggleOnlyActivitiesWithAscents: () => void;
}
export default function ActivityList(props: ActivityListProps) {
  return (
    <Container>
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
    </Container>
  );
}
