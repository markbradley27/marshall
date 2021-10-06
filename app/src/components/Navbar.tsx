import UserControl from "./UserControl";

import Container from "react-bootstrap/Container";
import BsNavbar from "react-bootstrap/Navbar";

function Navbar() {
  return (
    <BsNavbar>
      <Container>
        <BsNavbar.Brand>Marshall</BsNavbar.Brand>
        <UserControl />
      </Container>
    </BsNavbar>
  );
}

export default Navbar;
