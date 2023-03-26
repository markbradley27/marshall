import { FirebaseError } from "firebase/app";
import { useState } from "react";
import { Alert, Button, Form, Image, Stack } from "react-bootstrap";

import { useAuth } from "../contexts/auth";

import UserManagementContainer from "./UserManagementContainer";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const auth = useAuth();

  async function handleSubmit(e: any) {
    e.preventDefault();
    try {
      setErrorMsg("");
      setLoggingIn(true);
      await auth.login(email, password);
    } catch (error) {
      if (error instanceof FirebaseError) {
        const code = error.code;
        if (code === "auth/invalid-email") {
          setErrorMsg("Email is invalid.");
        } else if (code === "auth/user-disabled") {
          setErrorMsg("User has been disabled.");
        } else if (code === "auth/user-not-found") {
          setErrorMsg("Account not found.");
        } else if (code === "auth/wrong-password") {
          setErrorMsg("Wrong password.");
        } else {
          setErrorMsg("Something went wrong.");
        }
      } else {
        setErrorMsg("Something went wrong.");
      }
      setLoggingIn(false);
    }
  }

  return (
    <UserManagementContainer>
      <div className="p-3 border">
        <Image src={"/graphics/logo_full_fontless.svg"} className="w-100" />
        <hr />
        {errorMsg && (
          <Alert variant="danger" onClose={() => setErrorMsg("")} dismissible>
            {errorMsg}
          </Alert>
        )}
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
