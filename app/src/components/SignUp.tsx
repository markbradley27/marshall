import { FirebaseError } from "firebase/app";
import { useState } from "react";
import { Alert, Button, Form, Image, Stack } from "react-bootstrap";

import { useAuth } from "../contexts/auth";

import UserManagementContainer from "./UserManagementContainer";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const auth = useAuth();

  async function handleSubmit(e: any) {
    e.preventDefault();
    setErrorMsg("");
    setSigningUp(true);
    try {
      await auth.signup(email, password, name);
    } catch (error) {
      if (error instanceof FirebaseError) {
        const code = error.code;
        if (code === "auth/email-already-in-use") {
          setErrorMsg("Email is already in use.");
        } else if (code === "auth/invalid-email") {
          setErrorMsg("Email is invalid.");
        } else if (code === "auth/weak-password") {
          setErrorMsg("Password is too weak.");
        } else {
          setErrorMsg("Something went wrong.");
          console.log("Signup error:", error.message);
        }
      } else {
        setErrorMsg("Something went wrong.");
        console.log("Signup error:", error);
      }
      setSigningUp(false);
    }
  }

  return (
    <UserManagementContainer>
      <div className="p-3 border">
        <Image height={122} src={"/graphics/logo_full_fontless.svg"} />
        <hr />
        {errorMsg && (
          <Alert variant="danger" onClose={() => setErrorMsg("")} dismissible>
            {errorMsg}
          </Alert>
        )}
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
