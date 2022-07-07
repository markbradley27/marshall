import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import { useAuth } from "../contexts/auth";

export default function UserStats() {
  const auth = useAuth();

  return (
    <>
      {auth.dbUser && (
        <Row className="border">
          <Col>{auth.dbUser.name}</Col>
          <Col>Activities: {auth.dbUser.activityCount}</Col>
          <Col>Ascents: {auth.dbUser.ascentCount}</Col>
        </Row>
      )}
    </>
  );
}
