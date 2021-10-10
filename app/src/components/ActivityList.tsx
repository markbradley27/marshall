import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";

import ActivityListItem from "./ActivityListItem";
import { ActivityState } from "../api_shim";

interface ActivityListProps {
  title: string;
  activities: ActivityState[];
}
export default function ActivityList(props: ActivityListProps) {
  return (
    <Container>
      <h3>{props.title}</h3>
      <ListGroup>
        {props.activities.map((activity) => {
          return <ActivityListItem key={activity.id} activity={activity} />;
        })}
      </ListGroup>
    </Container>
  );
}
