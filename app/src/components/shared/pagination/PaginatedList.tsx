import { ReactElement, useEffect, useState } from "react";
import { Col, ListGroup, Row, Spinner, Stack } from "react-bootstrap";

import PageSelector from "./PageSelector";

interface PaginatedListProps {
  // Array of elements to be rendered as list items.
  // If elements is null, will display loading indicator while more are fetched.
  // If elements is initially empty, will immediately request first page of
  // elements via fetchMoreElements.
  elements: Array<ReactElement | undefined> | null;
  // Total number of elements that could be displayed (including any that aren't
  // currently displayed or loaded).
  // If count is zero, will display emptyPlaceholder message.
  count: number;
  // Callback to fetch elements from index min up to but excluding index max.
  // The callback should populate props.elements with the requested elements,
  // filling in any gaps with 'undefined'.
  fetchMoreElements: (min: number, max: number) => void;
  // Number of elements to display on each page.
  pageLength: number;
  // String to display if there are no elements.
  emptyPlaceholder?: string;
}
export default function PaginatedList(props: PaginatedListProps) {
  const { emptyPlaceholder = "Nothing to see here." } = props;

  const [page, setPage] = useState(0);

  useEffect(() => {
    if (props.elements == null) {
      return;
    }
    // Ensure all elements that should be displayed are provided in
    // props.elements. If not, fetch more.
    for (
      let i = page * props.pageLength;
      i < Math.min((page + 1) * props.pageLength, props.count);
      ++i
    ) {
      if (props.elements[i] == null) {
        props.fetchMoreElements(
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
        {props.elements == null ? (
          <ListGroup.Item className={"text-center"} disabled>
            <Spinner animation="border">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </ListGroup.Item>
        ) : props.elements.length === 0 ? (
          <ListGroup.Item className={"text-center"} disabled>
            {emptyPlaceholder}
          </ListGroup.Item>
        ) : (
          props.elements.slice(
            page * props.pageLength,
            (page + 1) * props.pageLength
          )
        )}
      </ListGroup>
      {props.count > props.pageLength && (
        <Row className="justify-content-center">
          <Col xs={"auto"}>
            <PageSelector
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
