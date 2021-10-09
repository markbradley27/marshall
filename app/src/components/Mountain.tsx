import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Ratio from "react-bootstrap/Ratio";
import Row from "react-bootstrap/Row";
import { useJsApiLoader } from "@react-google-maps/api";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { apiFetchMountain, MountainState } from "../api_shim";
import MountainList from "./MountainList";
import MountainMap from "./MountainMap";
import AscentList from "./AscentList";
import { useAuth } from "../contexts/auth";

type MountainProps = RouteComponentProps<{
  mountainId: string;
}>;
function Mountain(props: MountainProps) {
  const [mountain, setMountain] = useState<MountainState | null>(null);

  const auth = useAuth();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });

  useEffect(() => {
    async function fetchMountain() {
      const idToken = (await auth.user?.getIdToken()) as string;
      const mountain = await apiFetchMountain(
        parseInt(props.match.params.mountainId, 10),
        { idToken, includeNearby: true, includeAscents: true }
      );
      setMountain(mountain);
    }

    if (mountain == null && isLoaded) {
      fetchMountain();
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
            <MountainMap mountain={mountain} nearby={mountain.nearby} />
          </Ratio>
        </Col>
      </Row>
    </Container>
  ) : (
    <></>
  );
}

export default withRouter(Mountain);
