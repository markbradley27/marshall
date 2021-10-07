import toBBox from "geojson-bounding-box";
import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Ratio from "react-bootstrap/Ratio";
import Row from "react-bootstrap/Row";
import { useJsApiLoader } from "@react-google-maps/api";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { ActivityInfo } from "./activity_types";
import { ActivityMap } from "./ActivityMap";
import AscentList from "./AscentList";
import { useAuth } from "../contexts/auth";

type ActivityProps = RouteComponentProps<{
  activityId: string;
}>;
function Activity(props: ActivityProps) {
  const [activity, setActivity] = useState<ActivityInfo | null>(null);

  const auth = useAuth();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });

  useEffect(() => {
    async function fetchActivity() {
      const idToken = (await auth.user?.getIdToken()) as string;
      const activityResp: Response = await fetch(
        "/api/client/activity/" +
          props.match.params.activityId +
          "?include_ascents=true",
        {
          headers: {
            "id-token": idToken,
          },
        }
      );
      const activityJson = await activityResp.json();

      const path = activityJson.path.coordinates.map((coords: any) => {
        return { lat: coords[1], lng: coords[0] };
      });

      // TODO: Come up with some way of sorting the ascents by the order in
      // which they happend during the activity.
      const ascents = activityJson.ascents.map((ascent: any, idx: number) => {
        const coords = ascent.mountain.location.coordinates;
        return {
          id: ascent.id,
          n: idx + 1,
          mountain: {
            id: ascent.mountain.id,
            name: ascent.mountain.name,
            coords: { lat: coords[1], lng: coords[0] },
          },
        };
      });

      const boundingBox = toBBox(activityJson.path);
      const bounds = new google.maps.LatLngBounds(
        { lat: boundingBox[1], lng: boundingBox[0] },
        { lat: boundingBox[3], lng: boundingBox[2] }
      );

      setActivity({
        name: activityJson.name,
        date: activityJson.date,
        path: path,
        bounds: bounds,
        ascents: ascents,
      });
    }

    if (activity == null && auth.user != null && isLoaded) {
      fetchActivity();
    }
  });

  return activity ? (
    <Container>
      <Row>
        <Col xs={7}>
          <h2>{activity.name}</h2>
          <AscentList ascents={activity.ascents} />
        </Col>
        <Col xs={5}>
          <Ratio aspectRatio="4x3">
            <ActivityMap
              path={activity.path}
              ascents={activity.ascents}
              bounds={activity.bounds}
            />
          </Ratio>
        </Col>
      </Row>
    </Container>
  ) : (
    <></>
  );
}

export default withRouter(Activity);
