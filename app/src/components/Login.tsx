import { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import { useAuth } from "../contexts/auth";

import UserManagementContainer from "./UserManagementContainer";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const auth = useAuth();

  function handleSubmit(e: any) {
    e.preventDefault();
    setLoggingIn(true);
    auth.login(email, password);
  }

  return (
    <UserManagementContainer>
      <Row className="p-2 border">
        <h2>LOGO</h2>
        <Col>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </Form.Group>
            <Button
              className={"mb-2 w-100 " + (loggingIn ? "disabled" : "")}
              type="submit"
            >
              Login
            </Button>
          </Form>
        </Col>
      </Row>
      <Row className="p-2 border" style={{ textAlign: "center" }}>
        <Col>
          <a href="/TODO">Forgot password?</a>
          <br />
          . . .
          <br />
          Don't have an account yet? <a href="/signup">Sign up!</a>
        </Col>
      </Row>
    </UserManagementContainer>
  );
}
