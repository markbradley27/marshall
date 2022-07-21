import { AscentState } from "api/ascent_endpoints";
import SmartPagination from "components/shared/SmartPagination";
import AscentListItem from "components/shared/ascent/AscentListItem";
import { useEffect, useState } from "react";
import { Col, ListGroup, Row, Stack } from "react-bootstrap";

interface AscentListProps {
  ascents: Array<AscentState | undefined>;
  count: number;
  fetchMoreAscents: (min: number, max: number) => void;
  pageLength: number;
}
export default function AscentList(props: AscentListProps) {
  const [page, setPage] = useState(0);

  useEffect(() => {
    for (
      let i = page * props.pageLength;
      i < Math.min((page + 1) * props.pageLength, props.count);
      ++i
    ) {
      if (props.ascents[i] == null) {
        props.fetchMoreAscents(
          page * props.pageLength,
          Math.min((page + 1) * props.pageLength, props.count - 1)
        );
        break;
      }
    }
  }, [page, props]);

  return (
    <Stack gap={3}>
      <ListGroup as={Row}>
        {props.ascents.length > 0 ? (
          props.ascents
            .slice(page * props.pageLength, (page + 1) * props.pageLength)
            .map((ascent) => {
              return ascent ? (
                <AscentListItem key={ascent.id} ascent={ascent} />
              ) : (
                <></>
              );
            })
        ) : (
          <ListGroup.Item as={Row} className={"text-center text-muted"}>
            No ascents yet, get out there!
          </ListGroup.Item>
        )}
      </ListGroup>
      {props.count > props.pageLength && (
        <Row className="justify-content-center">
          <Col xs={"auto"}>
            <SmartPagination
              count={props.count}
              page={page}
              pageLength={props.pageLength}
              setPage={setPage}
            />
          </Col>
        </Row>
      )}
    </Stack>
  );
}
