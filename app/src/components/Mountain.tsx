import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Ratio from "react-bootstrap/Ratio";
import Row from "react-bootstrap/Row";
import { useJsApiLoader } from "@react-google-maps/api";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { MountainInfo } from "./mountain_types";
import MountainMap from "./MountainMap";

type MountainProps = RouteComponentProps<{
  mountainId: string;
}>;
function Mountain(props: MountainProps) {
  const [mountain, setMountain] = useState<MountainInfo | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });

  useEffect(() => {
    async function fetchMountain() {
      const mountainResp: Response = await fetch(
        "/api/client/mountain/" + props.match.params.mountainId
      );
      const mountainJson = await mountainResp.json();

      setMountain({
        id: mountainJson.id,
        name: mountainJson.name,
        coords: new google.maps.LatLng({
          lat: mountainJson.location.coordinates[1],
          lng: mountainJson.location.coordinates[0],
        }),
        wikipediaLink: mountainJson.wikipediaLink,
        abstract: mountainJson.abstract,
      });
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
        </Col>
        <Col xs={5}>
          <Ratio aspectRatio="4x3">
            <MountainMap mountain={mountain} />
          </Ratio>
        </Col>
      </Row>
    </Container>
  ) : (
    <></>
  );
}

export default withRouter(Mountain);
