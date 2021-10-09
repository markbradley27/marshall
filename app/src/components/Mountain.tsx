import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Ratio from "react-bootstrap/Ratio";
import Row from "react-bootstrap/Row";
import { useJsApiLoader } from "@react-google-maps/api";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { apiMountainToMountainInfo, MountainInfo } from "./mountain_types";
import MountainList from "./MountainList";
import MountainMap from "./MountainMap";
import AscentList from "./AscentList";
import { useAuth } from "../contexts/auth";

type MountainProps = RouteComponentProps<{
  mountainId: string;
}>;
function Mountain(props: MountainProps) {
  const [mountain, setMountain] = useState<MountainInfo | null>(null);

  const auth = useAuth();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });

  useEffect(() => {
    async function fetchMountain() {
      let fetchUrl =
        "/api/client/mountains/" +
        props.match.params.mountainId +
        "?include_nearby=true";
      let fetchOptions: any = {};
      if (auth.user != null) {
        fetchUrl += "&include_ascents=true";
        const idToken = (await auth.user.getIdToken()) as string;
        fetchOptions.headers = {
          "id-token": idToken,
        };
      }
      const mountainResp: Response = await fetch(fetchUrl, fetchOptions);
      const mountainJson = await mountainResp.json();

      const mountain: MountainInfo = apiMountainToMountainInfo(mountainJson);
      mountain.nearby = mountainJson.nearby.map(apiMountainToMountainInfo);
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
          <MountainList
            title="Nearby peaks:"
            mountains={mountain.nearby as MountainInfo[]}
          />
          {mountain.ascents && (
            <AscentList title="Your ascents:" ascents={mountain.ascents} />
          )}
        </Col>
        <Col xs={5}>
          <Ratio aspectRatio="4x3">
            <MountainMap
              mountain={mountain}
              nearby={mountain.nearby as MountainInfo[]}
            />
          </Ratio>
        </Col>
      </Row>
    </Container>
  ) : (
    <></>
  );
}

export default withRouter(Mountain);
