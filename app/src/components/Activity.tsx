import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Ratio from "react-bootstrap/Ratio";
import Row from "react-bootstrap/Row";
import { useJsApiLoader } from "@react-google-maps/api";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { apiFetchActivity, ActivityState, AscentState } from "../api_shim";
import { ActivityMap } from "./ActivityMap";
import AscentList from "./AscentList";
import { useAuth } from "../contexts/auth";

type ActivityProps = RouteComponentProps<{
  activityId: string;
}>;
function Activity(props: ActivityProps) {
  const [activity, setActivity] = useState<ActivityState | null>(null);

  const auth = useAuth();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });

  useEffect(() => {
    async function fetchActivity() {
      const idToken = (await auth.user?.getIdToken()) as string;
      const activity = await apiFetchActivity(
        parseInt(props.match.params.activityId, 10),
        {
          idToken,
          includeAscents: true,
          includeBounds: true,
        }
      );

      // TODO: Come up with some way of sorting the ascents by the order in
      // which they happend during the activity.
      activity.ascents?.forEach((ascent: AscentState, idx: number) => {
        ascent.n = idx + 1;
      });

      setActivity(activity);
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
          <h4>{activity.date.toLocaleString()}</h4>
          {activity.source === "strava" && (
            <h4>
              <a href={"http://www.strava.com/activities/" + activity.sourceId}>
                Sourced from Strava
              </a>
            </h4>
          )}
          {activity.ascents && (
            <AscentList title="Ascents" ascents={activity.ascents} />
          )}
        </Col>
        <Col xs={5}>
          {activity.ascents && activity.bounds && (
            <Ratio aspectRatio="4x3">
              <ActivityMap
                path={activity.path}
                ascents={activity.ascents}
                bounds={activity.bounds}
              />
            </Ratio>
          )}
        </Col>
      </Row>
    </Container>
  ) : (
    <></>
  );
}

export default withRouter(Activity);
