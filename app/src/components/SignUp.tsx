import { useCallback, useState } from "react";
import { Button, Form, Stack } from "react-bootstrap";

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
      <div className="p-3 border">
        <h2>LOGO</h2>
        <Form onSubmit={handleSubmit}>
          <Stack gap={3}>
            <Form.Group controlId="formBasicName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Name"
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </Form.Group>
            <Form.Group controlId="formBasicEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Email"
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </Form.Group>
            <Form.Group controlId="formBasicPassword">
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
              className={"mb-2 w-100" + (signingUp ? " disabled" : "")}
              type="submit"
            >
              Sign Up
            </Button>
          </Stack>
        </Form>
      </div>
    </UserManagementContainer>
  );
}
