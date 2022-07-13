
import { AscentState } from "api_client";
import AscentListItem from "components/shared/ascent/AscentListItem";
import { ListGroup, Row } from "react-bootstrap";

interface AscentListProps {
  title: string;
  ascents: AscentState[];
}
function AscentList(props: AscentListProps) {
  return (
    <Row>
      <h3>{props.title}</h3>
      <ListGroup>
        {props.ascents.map((ascent) => {
          return <AscentListItem key={ascent.id} ascent={ascent} />;
        })}
      </ListGroup>
    </Row>
  );
}

export default AscentList;
