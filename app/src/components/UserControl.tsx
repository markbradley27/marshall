import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

import { useAuth } from "../contexts/auth";

function UserControl() {
  const auth = useAuth();

  if (auth.user == null) {
    return (
      <div>
        <Button href="/login">Login</Button> or{" "}
        <Button href="/signup">Sign Up</Button>
      </div>
    );
  } else {
    return (
      <DropdownButton className="px-2" title={auth.user.displayName}>
        <Dropdown.Item href="/settings">Settings</Dropdown.Item>
        <Dropdown.Item onClick={auth.logout}>Logout</Dropdown.Item>
      </DropdownButton>
    );
  }
}

export default UserControl;
