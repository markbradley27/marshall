import { fetchList, ListState } from "api/list_endpoints";
import GoogleMap from "components/shared/map/GoogleMap";
import MountainList from "components/shared/mountain/MountainList";
import { useAuth } from "contexts/auth";
import { useEffect, useState } from "react";
import { Ratio, Stack } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";

type ListProps = RouteComponentProps<{
  listId: string;
}>;

// TODO: Handle lists that aren't public.
function List(props: ListProps) {
  const auth = useAuth();

  const [list, setList] = useState<ListState | null>(null);

  useEffect(() => {
    async function fetchData() {
      setList(
        await fetchList(Number(props.match.params.listId), {
          idToken: await auth.users?.fb?.getIdToken(),
        })
      );
    }
    fetchData();
  }, [auth.users?.fb, props.match.params.listId]);

  return list ? (
    <Stack gap={3}>
      <Ratio aspectRatio="21x9">
        <GoogleMap secondaries={list.mountains} />
      </Ratio>
      <h2>{list.name}</h2>
      {list.description && <p>{list.description}</p>}
      <h3>Mountains:</h3>
      <MountainList mountains={list.mountains} namesAreLinks={true} />
    </Stack>
  ) : (
    <></>
  );
}

export default withRouter(List);
