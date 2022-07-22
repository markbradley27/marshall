import { AscentState } from "api/ascent_endpoints";
import { DateTime } from "luxon";
import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import Row from "react-bootstrap/Row";

interface AscentListItemProps {
  ascent: AscentState;
}
function AscentListItem(props: AscentListItemProps) {
  const dateTime = DateTime.fromISO(
    props.ascent.time != null
      ? props.ascent.date + "T" + props.ascent.time
      : props.ascent.date,
    { zone: props.ascent.timeZone }
  );
  const dateTimeDisplay = dateTime.toLocaleString(
    props.ascent.time != null
      ? DateTime.DATETIME_MED_WITH_WEEKDAY
      : DateTime.DATE_MED_WITH_WEEKDAY
  );

  return (
    <ListGroup.Item>
      <Row>
        {props.ascent.mountain && (
          <Col>
            <a href={"/mountain/" + props.ascent.mountain.id}>
              {props.ascent.mountain.name}
            </a>
          </Col>
        )}
        <Col>
          {props.ascent.activityId != null ? (
            <a href={"/activity/" + props.ascent.activityId}>
              {dateTimeDisplay}
            </a>
          ) : (
            <span className="text-muted">{dateTimeDisplay}</span>
          )}
        </Col>
      </Row>
    </ListGroup.Item>
  );
}

export default AscentListItem;
