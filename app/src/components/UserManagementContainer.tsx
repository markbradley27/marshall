import { PropsWithChildren } from "react";
import Container from "react-bootstrap/Container";

import { useAuth } from "../contexts/auth";

export default function UserManagementContainer(props: PropsWithChildren<{}>) {
  const auth = useAuth();

  if (auth.user != null) {
    return <h2>Signed in as {auth.user.displayName}.</h2>;
  } else {
    return <Container style={{ width: "400px" }}>{props.children}</Container>;
  }
}
