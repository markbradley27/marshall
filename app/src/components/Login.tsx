import { useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import { useAuth } from "../contexts/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const auth = useAuth();

  function handleSubmit(e: any) {
    e.preventDefault();
    setLoggingIn(true);
    auth.login(email, password);
  }

  if (auth.user != null) {
    return <h2>Signed in as {auth.user.displayName}.</h2>;
  } else {
    return (
      <Container className="border" style={{ width: "400px" }}>
        <Row className="p-2">
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
                className={"mb-2 " + (loggingIn ? "disabled" : "")}
                style={{ width: "100%" }}
                type="submit"
              >
                Login
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default Login;
