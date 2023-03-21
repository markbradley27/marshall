import { useAuth } from "contexts/auth";
import { Container, Image, Nav, Navbar as BsNavbar } from "react-bootstrap";

import AddSomethingDropdown from "./AddSomethingDropdown";
import UserDropdown from "./UserDropdown";

interface NavbarProps {
  fullLogo?: boolean;
}
function Navbar({ fullLogo = true }: NavbarProps) {
  const auth = useAuth();

  return (
    <BsNavbar className="bg-light">
      <Container>
        <BsNavbar.Brand href="/">
          <Image
            src={
              fullLogo
                ? "/graphics/logo_full_fontless.svg"
                : "/graphics/logo_icon.svg"
            }
          />
        </BsNavbar.Brand>
        <BsNavbar.Collapse>
          <Nav>
            <Nav.Link href="/mountains">Mountains</Nav.Link>
            <Nav.Link href="/TODO">Summit Lists</Nav.Link>
          </Nav>
        </BsNavbar.Collapse>
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
      </Container>
    </BsNavbar>
  );
}

export default Navbar;
