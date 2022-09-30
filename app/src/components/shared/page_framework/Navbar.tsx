import { useAuth } from "contexts/auth";
import { Container, Image, Nav, Navbar as BsNavbar } from "react-bootstrap";
import { useLocation } from "react-router-dom";

import AddSomethingDropdown from "./AddSomethingDropdown";
import UserDropdown from "./UserDropdown";

function Navbar() {
  const auth = useAuth();
  const location = useLocation();

  return (
    <BsNavbar className="bg-light">
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
              <UserDropdown />
            </Nav>
          </BsNavbar.Collapse>
        )}
      </Container>
    </BsNavbar>
  );
}

export default Navbar;
