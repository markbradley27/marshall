import { MountainState } from "api/mountain_endpoints";
import { Col, Row, Stack } from "react-bootstrap";
import { CheckLg, XLg } from "react-bootstrap-icons";
import ListGroup from "react-bootstrap/ListGroup";

interface MountainListItemProps {
  mountain: MountainState;
  namesAreLinks?: boolean;
  onConfirm?: () => void;
  onRemove?: () => void;
}

export default function MountainListItem(props: MountainListItemProps) {
  const { namesAreLinks = true } = props;

  return (
    <ListGroup.Item>
      <Row>
        <Col>
          {namesAreLinks ? (
            <a href={"/mountain/" + props.mountain.id}>{props.mountain.name}</a>
          ) : (
            props.mountain.name
          )}
        </Col>
        {(props.onConfirm != null || props.onRemove != null) && (
          <Col className="align-self-center">
            <Stack className="float-end" gap={3} direction="horizontal">
              {props.onConfirm != null && <CheckLg onClick={props.onConfirm} />}
              {props.onRemove != null && <XLg onClick={props.onRemove} />}
            </Stack>
          </Col>
        )}
      </Row>
    </ListGroup.Item>
  );
}
