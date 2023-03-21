import { useState } from "react";
import { Button, Form, Image, Stack } from "react-bootstrap";

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
      <div className="p-3 border">
        <Image src={"/graphics/logo_full_fontless.svg"} className="w-100" />
        <hr />
        <Form onSubmit={handleSubmit}>
          <Stack gap={3}>
            <Form.Group controlId="formBasicEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </Form.Group>
            <Form.Group controlId="formBasicPassword">
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
          </Stack>
        </Form>
      </div>
    </UserManagementContainer>
  );
}
