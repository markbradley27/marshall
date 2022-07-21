import { MountainState } from "api/mountain_endpoints";
import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";

import MountainListItem from "./MountainListItem";

interface MountainListProps {
  title: string;
  mountains: MountainState[];
}
export default function MountainList(props: MountainListProps) {
  return (
    <Container>
      <h3>{props.title}</h3>
      <ListGroup>
        {props.mountains.map((mountain) => {
          return <MountainListItem key={mountain.id} mountain={mountain} />;
        })}
      </ListGroup>
    </Container>
  );
}
