import { AscentState, fetchAscent } from "api/ascent_endpoints";
import AscentList from "components/shared/ascent/AscentList";
import { useAuth } from "contexts/auth";
import { useCallback, useState } from "react";
import { Row } from "react-bootstrap";

import AddAscentForm from "./AddAscentForm";
import RecentAscents from "./RecentAscents";

export default function AddAscent() {
  const auth = useAuth();

  const [justAddedAscents, setJustAddedAscents] = useState<AscentState[]>([]);

  const addJustAdded = useCallback(
    async (id: number) => {
      const ascent = await fetchAscent(id, {
        idToken: (await auth.users?.fb?.getIdToken()) as string,
        includeMountain: true,
      });
      setJustAddedAscents([ascent, ...justAddedAscents]);
    },
    [auth.users?.fb, justAddedAscents]
  );

  return (
    <>
      <Row>
        <h3>Add ascent:</h3>
        <AddAscentForm reportAdded={addJustAdded} />
      </Row>
      {justAddedAscents.length > 0 && (
        <>
          <hr />
          <Row>
            <h3>Just added:</h3>
            <AscentList
              ascents={justAddedAscents}
              count={justAddedAscents.length}
              fetchMoreAscents={() => {}}
              pageLength={15}
            />
          </Row>
        </>
      )}
      <hr />
      <Row>
        <h3>Your recent ascents:</h3>
        <RecentAscents />
      </Row>
    </>
  );
}
