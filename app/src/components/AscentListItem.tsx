import ListGroupItem from "react-bootstrap/ListGroupItem";

interface AscentListItemProps {
  ascent: any;
}
function AscentListItem(props: AscentListItemProps) {
  return <ListGroupItem>{props.ascent.name}</ListGroupItem>;
}

export default AscentListItem;
