import { Row } from "react-bootstrap";

import AddActivityForm from "./AddActivityForm";

export default function AddActivity() {
  return (
    <>
      <Row>
        <h3>Add activity:</h3>
        <AddActivityForm />
      </Row>
    </>
  );
}
