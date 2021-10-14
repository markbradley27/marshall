import Container from "react-bootstrap/Container";
import BsNavbar from "react-bootstrap/Navbar";
import { useLocation } from "react-router-dom";

import UserControl from "./UserControl";

function Navbar() {
  const location = useLocation();
  console.log("path:", location.pathname);
  return (
    <BsNavbar className="pb-4">
      <Container>
        <BsNavbar.Brand href="/">Marshall</BsNavbar.Brand>
        {location.pathname !== "/login" && <UserControl />}
      </Container>
    </BsNavbar>
  );
}

export default Navbar;
