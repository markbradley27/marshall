import { Container, Image, Nav, Navbar as BsNavbar } from "react-bootstrap";
import { useLocation } from "react-router-dom";

import { useAuth } from "../contexts/auth";

import AddSomethingDropdown from "./AddSomethingDropdown";
import UserControl from "./UserControl";

function Navbar() {
  const auth = useAuth();
  const location = useLocation();

  return (
    <BsNavbar className="mb-3 bg-light">
      <Container>
        <BsNavbar.Brand href="/">
          <Image src="/graphics/logo_full.svg" />
        </BsNavbar.Brand>
        <BsNavbar.Collapse>
          <Nav>
            <Nav.Link href="/mountains">Mountains</Nav.Link>
            <Nav.Link href="/summit_lists">Summit Lists</Nav.Link>
          </Nav>
        </BsNavbar.Collapse>
        {location.pathname !== "/login" && (
          <BsNavbar.Collapse className="justify-content-end">
            <Nav>
              {auth.users?.fb && (
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
