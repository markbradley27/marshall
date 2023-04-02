import { PropsWithChildren } from "react";
import { Col, Container, Row } from "react-bootstrap";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function PageFrame(props: PropsWithChildren<{}>) {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main className="flex-shrink-0 my-3">
        <Container>
          <Row>
            <Col md={{ span: 2, order: 1 }} xs={{ order: 2 }}>
              <Sidebar />
            </Col>
            <Col md={{ span: 8, order: 2 }} xs={{ order: 3 }}>
              {props.children}
            </Col>
            {/* TODO: Handle narrow windows better.*/}
            <Col md={{ span: 2, order: 3 }} xs={{ order: 1 }}></Col>
          </Row>
        </Container>
      </main>
      <footer className="footer mt-auto py-3 bg-light">
        <Container>
          <span className="text-muted">
            Beyond mountains, there are mountains.
          </span>
        </Container>
      </footer>
    </>
  );
}
