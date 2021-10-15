import Nav from "react-bootstrap/Nav";

import { useAuth } from "../contexts/auth";

export default function Sidebar() {
  const auth = useAuth();

  return (
    <div>
      <h3>{auth.user?.displayName}</h3>
      <Nav className="flex-column">
        <Nav.Link className="px-0" href="/ascents">
          Ascents
        </Nav.Link>
        <Nav.Link className="px-0" href="/activities">
          Activities
        </Nav.Link>
      </Nav>
    </div>
  );
}
