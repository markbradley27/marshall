import { fetchMountain, MountainState } from "api_client";
import MountainList from "components/MountainList";
import MountainMap from "components/MountainMap";
import AscentList from "components/shared/ascent/AscentList";
import { useAuth } from "contexts/auth";
import useGoogleMaps from "hooks/loadGoogleMaps";
import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Ratio from "react-bootstrap/Ratio";
import Row from "react-bootstrap/Row";
import { RouteComponentProps, withRouter } from "react-router-dom";

type MountainProps = RouteComponentProps<{
  mountainId: string;
}>;
function Mountain(props: MountainProps) {
  const [mountain, setMountain] = useState<MountainState | null>(null);

  const auth = useAuth();
  const googleMapsLoaded = useGoogleMaps();

  useEffect(() => {
    async function fetchData() {
      const mountain = await fetchMountain(
        Number(props.match.params.mountainId),
        {
          idToken: await auth.fbUser?.getIdToken(),
          includeNearby: true,
          includeAscents: true,
        }
      );
      setMountain(mountain);
    }

    if (mountain == null && googleMapsLoaded) {
      fetchData();
    }
  });

  return mountain ? (
    <Container>
      <Row>
        <Col xs={7}>
          <h2>
            <a href={mountain.wikipediaLink}>{mountain.name}</a>
          </h2>
          {mountain.abstract && <p>{mountain.abstract}</p>}
          {mountain.nearby && (
            <MountainList title="Nearby peaks:" mountains={mountain.nearby} />
          )}
          {mountain.ascents && (
            <AscentList title="Your ascents:" ascents={mountain.ascents} />
          )}
        </Col>
        <Col xs={5}>
          <Ratio aspectRatio="4x3">
            <MountainMap primary={mountain} secondaries={mountain.nearby} />
          </Ratio>
        </Col>
      </Row>
    </Container>
  ) : (
    <></>
  );
}

export default withRouter(Mountain);
