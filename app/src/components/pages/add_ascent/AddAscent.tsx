import { Row } from "react-bootstrap";

import AddAscentForm from "./AddAscentForm";
import RecentAscents from "./RecentAscents";

export default function AddAscent() {
  return (
    <>
      <Row>
        <h3>Add ascent:</h3>
        <AddAscentForm />
      </Row>
      <hr />
      <Row>
        <h3>Your recent ascents:</h3>
        <RecentAscents />
      </Row>
    </>
  );
}
