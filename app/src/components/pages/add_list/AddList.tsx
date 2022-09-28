import { Row } from "react-bootstrap";

import AddListForm from "./AddListForm";

export default function AddList() {
  return (
    <>
      <Row>
        <h3>Add list:</h3>
        <AddListForm />
      </Row>
    </>
  );
}
