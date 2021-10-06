import toBBox from "geojson-bounding-box";
import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Ratio from "react-bootstrap/Ratio";
import Row from "react-bootstrap/Row";
import { RouteComponentProps, withRouter } from "react-router-dom";

import ActivityMap from "./ActivityMap";
import AscentList from "./AscentList";
import { useAuth } from "../contexts/auth";

type ActivityProps = RouteComponentProps<{
  activityId: string;
}>;
function Activity(props: ActivityProps) {
  // TODO: Figure out google maps types.
  const [name, setName] = useState("");
  const [path, setPath] = useState<any>(null);
  const [mountains, setMountains] = useState<any>(null);
  const [bounds, setBounds] = useState<any>(null);

  const auth = useAuth();

  useEffect(() => {
    async function fetchActivity() {
      const idToken = (await auth.user?.getIdToken()) as string;
      const activityResp: Response = await fetch(
        "/api/client/activity?include_ascents=true&activity_id=" +
          props.match.params.activityId,
        {
          headers: {
            "id-token": idToken,
          },
        }
      );
      const activity = await activityResp.json();

      const path = activity.path.coordinates.map((coords: any) => {
        return { lat: coords[1], lng: coords[0] };
      });

      const mountains = activity.Ascents.map((ascent: any) => {
        const coords = ascent.Mountain.location.coordinates;
        return {
          id: ascent.Mountain.id,
          name: ascent.Mountain.name,
          coords: { lat: coords[1], lng: coords[0] },
        };
      });

      const boundingBox = toBBox(activity.path);
      const bounds = {
        north: boundingBox[3],
        south: boundingBox[1],
        west: boundingBox[0],
        east: boundingBox[2],
      };

      setPath(path);
      setMountains(mountains);
      setBounds(bounds);
      setName(activity.name);
    }

    if (path == null && auth.user != null) {
      fetchActivity();
    }
  });

  return name ? (
    <Container>
      <Row>
        <Col xs={7}>
          <h2>{name}</h2>
          <AscentList ascents={mountains} />
        </Col>
        <Col xs={5}>
          <Ratio aspectRatio="4x3">
            <ActivityMap path={path} mountains={mountains} bounds={bounds} />
          </Ratio>
        </Col>
      </Row>
    </Container>
  ) : (
    <></>
  );
}

export default withRouter(Activity);
