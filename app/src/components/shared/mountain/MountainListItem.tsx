import { MountainState } from "api/mountain_endpoints";
import { Col, Row, Stack } from "react-bootstrap";
import { CheckLg, XLg } from "react-bootstrap-icons";
import ListGroup from "react-bootstrap/ListGroup";

interface MountainListItemProps {
  isInvalid?: boolean;
  mountain: MountainState;
  namesAreLinks?: boolean;
  onConfirm?: () => void;
  onRemove?: () => void;
  variant?: string;
}

export default function MountainListItem(props: MountainListItemProps) {
  return (
    <ListGroup.Item
      className={props.isInvalid === true ? "form-control is-invalid" : ""}
      variant={props.variant}
    >
      <Row>
        <Col>
          {props.namesAreLinks ? (
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
