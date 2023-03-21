import { PropsWithChildren } from "react";
import { Container } from "react-bootstrap";

import Navbar from "./Navbar";

export default function UnAuthedPageFrame(props: PropsWithChildren<{}>) {
  return (
    <>
      <header>
        <Navbar fullLogo={false} />
      </header>
      <main className="flex-shrink-0 my-3">
        <Container>{props.children}</Container>
      </main>
    </>
  );
}
