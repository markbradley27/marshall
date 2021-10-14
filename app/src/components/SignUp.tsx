import { useCallback, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import { useAuth } from "../contexts/auth";
import UserManagementContainer from "./UserManagementContainer";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingUp, setSigningUp] = useState(false);

  const auth = useAuth();

  const handleSubmit = useCallback(
    (e: any) => {
      e.preventDefault();
      setSigningUp(true);
      auth.signup(email, password, name);
    },
    [name, email, password, auth]
  );

  return (
    <UserManagementContainer>
      <Row className="p-2 border">
        <h2>LOGO</h2>
        <Col>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="name"
                placeholder="Name"
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Email"
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </Form.Group>
            <Button
              className={"mb-2 " + (signingUp ? "disabled" : "")}
              style={{ width: "100%" }}
              type="submit"
            >
              Sign Up
            </Button>
          </Form>
        </Col>
      </Row>
    </UserManagementContainer>
  );
}
