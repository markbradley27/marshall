import { AscentState } from "api/ascent_endpoints";
import SmartPagination from "components/shared/SmartPagination";
import AscentListItem from "components/shared/ascent/AscentListItem";
import { useEffect, useState } from "react";
import { Col, ListGroup, Row, Spinner, Stack } from "react-bootstrap";

interface AscentListProps {
  // If ascents is null, will display loading indicator.
  // If ascents is empty, will display "no ascents message.
  ascents: Array<AscentState | undefined> | null;
  count: number;
  fetchMoreAscents: (min: number, max: number) => void;
  pageLength: number;
  emptyPlaceholder?: string;
}
export default function AscentList(props: AscentListProps) {
  const { emptyPlaceholder = "Ascents list is empty." } = props;

  const [page, setPage] = useState(0);

  useEffect(() => {
    if (props.ascents == null) {
      return;
    }
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
      <ListGroup>
        {props.ascents != null ? (
          props.ascents.length > 0 ? (
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
            <ListGroup.Item className={"text-center"} disabled>
              {emptyPlaceholder}
            </ListGroup.Item>
          )
        ) : (
          <ListGroup.Item className={"text-center"} disabled>
            <Spinner animation="border">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
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
