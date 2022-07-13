import { fetchActivity, ActivityState, AscentState } from "api_client";
import { ActivityMap } from "components/ActivityMap";
import AscentList from "components/shared/ascent/AscentList";
import { useAuth } from "contexts/auth";
import useGoogleMaps from "hooks/loadGoogleMaps";
import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Ratio from "react-bootstrap/Ratio";
import Row from "react-bootstrap/Row";
import { RouteComponentProps, withRouter } from "react-router-dom";

type ActivityProps = RouteComponentProps<{
  activityId: string;
}>;
function Activity(props: ActivityProps) {
  const [activity, setActivity] = useState<ActivityState | null>(null);

  const auth = useAuth();

  const googleMapsLoaded = useGoogleMaps();

  useEffect(() => {
    async function fetchData() {
      const activity = await fetchActivity(
        Number(props.match.params.activityId),
        {
          idToken: (await auth.fbUser?.getIdToken()) as string,
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

    if (activity == null && auth.fbUser != null && googleMapsLoaded) {
      fetchData();
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
