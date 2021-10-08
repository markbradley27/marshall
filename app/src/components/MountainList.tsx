import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";

import MountainListItem from "./MountainListItem";
import { MountainInfo } from "./mountain_types";

interface MountainListProps {
  title: string;
  mountains: MountainInfo[];
}
export default function MountainList(props: MountainListProps) {
  return (
    <Container>
      <h3>{props.title}</h3>
      <ListGroup>
        {props.mountains.map((mountain: MountainInfo) => {
          return <MountainListItem key={mountain.id} mountain={mountain} />;
        })}
      </ListGroup>
    </Container>
  );
}
