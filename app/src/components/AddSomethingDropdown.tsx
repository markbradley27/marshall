import Dropdown from "react-bootstrap/Dropdown";
import { PlusLg } from "react-bootstrap-icons";

export default function AddSomethingDropdown() {
  return (
    <Dropdown className="px-2">
      <Dropdown.Toggle>
        <PlusLg style={{ verticalAlign: "-1px" }} />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item>Ascent</Dropdown.Item>
        <Dropdown.Item>Activity</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
