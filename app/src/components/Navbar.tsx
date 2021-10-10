import Container from "react-bootstrap/Container";
import BsNavbar from "react-bootstrap/Navbar";

import UserControl from "./UserControl";

function Navbar() {
  return (
    <BsNavbar>
      <Container>
        <BsNavbar.Brand href="/">Marshall</BsNavbar.Brand>
        <UserControl />
      </Container>
    </BsNavbar>
  );
}

export default Navbar;
