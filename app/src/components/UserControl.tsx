import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Nav from "react-bootstrap/Nav";

import { useAuth } from "../contexts/auth";

function UserControl() {
  const auth = useAuth();

  if (auth.fbUser == null) {
    return (
      <Nav>
        <Nav.Item className="px-2">
          <Button href="/login">Login</Button>
        </Nav.Item>
        <Nav.Item className="px-2">
          <Button href="/signup">Sign Up</Button>
        </Nav.Item>
      </Nav>
    );
  } else {
    return (
      <DropdownButton
        className="px-2"
        // For a split second, auth.dbUser is undefined. This avoids the
        // warning that titles must never be undefined.
        title={auth.dbUser ? auth.dbUser.name : "..."}
      >
        <Dropdown.Item href="/settings">Settings</Dropdown.Item>
        <Dropdown.Item onClick={auth.logout}>Logout</Dropdown.Item>
      </DropdownButton>
    );
  }
}

export default UserControl;
