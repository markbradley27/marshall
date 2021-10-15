import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import BsNavbar from "react-bootstrap/Navbar";
import { useLocation } from "react-router-dom";

import AddSomethingDropdown from "./AddSomethingDropdown";
import UserControl from "./UserControl";
import { useAuth } from "../contexts/auth";

function Navbar() {
  const auth = useAuth();
  const location = useLocation();

  return (
    <BsNavbar className="pt-3 pb-3 mb-3 bg-light">
      <Container>
        <BsNavbar.Brand href="/">Marshall</BsNavbar.Brand>
        <BsNavbar.Collapse>
          <Nav>
            <Nav.Link href="/mountains">Mountains</Nav.Link>
            <Nav.Link href="/summit_lists">Summit Lists</Nav.Link>
          </Nav>
        </BsNavbar.Collapse>
        {location.pathname !== "/login" && (
          <BsNavbar.Collapse className="justify-content-end">
            <Nav>
              {auth.user && (
                <Nav.Item>
                  <AddSomethingDropdown />
                </Nav.Item>
              )}
              <UserControl />
            </Nav>
          </BsNavbar.Collapse>
        )}
      </Container>
    </BsNavbar>
  );
}

export default Navbar;
