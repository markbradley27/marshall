import { useAuth } from "contexts/auth";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Nav from "react-bootstrap/Nav";

function UserDropdown() {
  const auth = useAuth();

  return auth.users?.fb == null ? (
    <Nav>
      <Nav.Item className="px-2">
        <Button href="/login">Login</Button>
      </Nav.Item>
      <Nav.Item className="px-2">
        <Button href="/signup">Sign Up</Button>
      </Nav.Item>
    </Nav>
  ) : (
    <DropdownButton className="px-2" title={auth.users?.db?.name}>
      <Dropdown.Item href="/settings">Settings</Dropdown.Item>
      <Dropdown.Item onClick={auth.logout}>Logout</Dropdown.Item>
    </DropdownButton>
  );
}

export default UserDropdown;
