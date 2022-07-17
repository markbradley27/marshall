import Nav from "react-bootstrap/Nav";

import { useAuth } from "../contexts/auth";

export default function Sidebar() {
  const auth = useAuth();

  return auth.users?.fb != null ? (
    <>
      <h3>{auth.users.fb.displayName}</h3>
      <Nav className="flex-md-column">
        <Nav.Link className="px-md-0" href="/ascents">
          Ascents
        </Nav.Link>
        <Nav.Link className="px-md-0" href="/activities">
          Activities
        </Nav.Link>
      </Nav>
    </>
  ) : (
    <></>
  );
}
