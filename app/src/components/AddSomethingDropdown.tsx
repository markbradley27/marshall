import { PlusLg } from "react-bootstrap-icons";
import Dropdown from "react-bootstrap/Dropdown";

export default function AddSomethingDropdown() {
  return (
    <Dropdown className="px-2">
      <Dropdown.Toggle>
        <PlusLg style={{ verticalAlign: "-1px" }} />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item href="/add_ascent">Ascent</Dropdown.Item>
        <Dropdown.Item>Activity</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
