import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import { UserState } from "../api_client";

interface UserStatsProps {
  user: UserState;
}
export default function UserStats(props: UserStatsProps) {
  return (
    <Row className="border">
      <Col>{props.user.name}</Col>
      <Col>Activities: {props.user.activityCount}</Col>
      <Col>Ascents: {props.user.ascentCount}</Col>
    </Row>
  );
}
