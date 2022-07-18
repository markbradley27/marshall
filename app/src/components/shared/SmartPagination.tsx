import { Pagination } from "react-bootstrap";

const PAGES_BEFORE_ELLIPSIS = 3;

interface SmartPaginationProps {
  count: number;
  page: number;
  pageLength: number;
  setPage: (page: number) => void;
}
export default function SmartPagination(props: SmartPaginationProps) {
  const pages = Math.ceil(props.count / props.pageLength);
  const items = [];
  if (props.page > PAGES_BEFORE_ELLIPSIS) {
    items.push(
      <Pagination.First
        key={"first"}
        onClick={() => {
          props.setPage(0);
        }}
      />
    );
  }
  if (props.page > 0) {
    items.push(
      <Pagination.Prev
        key={"prev"}
        onClick={() => {
          props.setPage(props.page - 1);
        }}
      />
    );
  }
  if (props.page > PAGES_BEFORE_ELLIPSIS) {
    items.push(<Pagination.Ellipsis disabled={true} key={"prevEllipsis"} />);
  }
  for (
    let i = Math.max(0, props.page - PAGES_BEFORE_ELLIPSIS);
    i < Math.min(pages, props.page + PAGES_BEFORE_ELLIPSIS + 1);
    ++i
  ) {
    items.push(
      <Pagination.Item
        active={i === props.page}
        key={i}
        onClick={() => {
          props.setPage(i);
        }}
      >
        {i + 1}
      </Pagination.Item>
    );
  }
  if (props.page < pages - PAGES_BEFORE_ELLIPSIS) {
    items.push(<Pagination.Ellipsis disabled={true} key={"nextEllipsis"} />);
  }
  if (props.page < pages - 1) {
    items.push(
      <Pagination.Next
        key={"next"}
        onClick={() => {
          props.setPage(props.page + 1);
        }}
      />
    );
  }
  if (props.page < pages - PAGES_BEFORE_ELLIPSIS) {
    items.push(
      <Pagination.Last
        key={"last"}
        onClick={() => {
          props.setPage(pages - 1);
        }}
      />
    );
  }

  return <Pagination>{items}</Pagination>;
}
