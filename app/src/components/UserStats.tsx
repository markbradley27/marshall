import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import { useAuth } from "../contexts/auth";

export default function UserStats() {
  const auth = useAuth();

  return (
    <>
      {auth.users?.db && (
        <Row className="border">
          <Col>{auth.users.db.name}</Col>
          <Col>Activities: {auth.users.db.activityCount}</Col>
          <Col>Ascents: {auth.users.db.ascentCount}</Col>
        </Row>
      )}
    </>
  );
}
