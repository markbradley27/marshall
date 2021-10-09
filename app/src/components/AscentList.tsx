import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";

import AscentListItem from "./AscentListItem";
import { AscentState } from "../api_shim";

interface AscentListProps {
  title: string;
  ascents: AscentState[];
}
function AscentList(props: AscentListProps) {
  return (
    <Container>
      <h3>{props.title}</h3>
      <ListGroup>
        {props.ascents.map((ascent) => {
          return <AscentListItem key={ascent.id} ascent={ascent} />;
        })}
      </ListGroup>
    </Container>
  );
}

export default AscentList;
