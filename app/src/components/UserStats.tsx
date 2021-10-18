import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import { UserState } from "../api_client";

interface UserStatsProps {
  user: UserState;
}
export default function UserStats(props: UserStatsProps) {
  return (
    <Container>
      <Row>
        <Col>{props.user.name}</Col>
        <Col>Activities: {props.user.activityCount}</Col>
        <Col>Ascents: {props.user.ascentCount}</Col>
      </Row>
    </Container>
  );
}
