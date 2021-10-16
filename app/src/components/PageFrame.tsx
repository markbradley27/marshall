import { PropsWithChildren } from "react";
import { Col, Container, Row } from "react-bootstrap";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function PageFrame(props: PropsWithChildren<{}>) {
  return (
    <Container>
      <Navbar />
      <Row>
        <Col md={{ span: 2, order: 1 }} xs={{ order: 2 }}>
          <Sidebar />
        </Col>
        <Col md={{ span: 8, order: 2 }} xs={{ order: 3 }}>
          {props.children}
        </Col>
        <Col md={{ span: 2, order: 3 }} xs={{ order: 1 }}></Col>
      </Row>
    </Container>
  );
}
