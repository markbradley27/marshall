import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

import { useAuth } from "../contexts/auth";

function UserControl() {
  const auth = useAuth();

  if (auth.user == null) {
    return <Button href="/login">Login</Button>;
  } else {
    return (
      <DropdownButton title={auth.user.displayName} id="user-dropdown">
        <Dropdown.Item onClick={auth.logout}>Logout</Dropdown.Item>
      </DropdownButton>
    );
  }
}

export default UserControl;
