import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";

import AscentListItem from "./AscentListItem";

interface AscentListProps {
  ascents: any;
}
function AscentList(props: AscentListProps) {
  return (
    <Container>
      <h3>Ascents</h3>
      <ListGroup>
        {props.ascents.map((ascent: any) => {
          return <AscentListItem ascent={ascent} />;
        })}
        ;
      </ListGroup>
    </Container>
  );
}

export default AscentList;
