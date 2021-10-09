import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";

import AscentListItem from "./AscentListItem";
import { AscentInfo } from "./activity_types";

interface AscentListProps {
  title: string;
  ascents: AscentInfo[];
}
function AscentList(props: AscentListProps) {
  return (
    <Container>
      <h3>{props.title}</h3>
      <ListGroup>
        {props.ascents.map((ascent: any) => {
          return <AscentListItem key={ascent.id} ascent={ascent} />;
        })}
      </ListGroup>
    </Container>
  );
}

export default AscentList;
