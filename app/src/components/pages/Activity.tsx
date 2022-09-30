import { fetchActivity, ActivityState } from "api/activity_endpoints";
import { AscentState } from "api/ascent_endpoints";
import { MountainState } from "api/mountain_endpoints";
import AscentList from "components/shared/ascent/AscentList";
import GoogleMap from "components/shared/map/GoogleMap";
import { useAuth } from "contexts/auth";
import { useEffect, useState } from "react";
import { Stack } from "react-bootstrap";
import Ratio from "react-bootstrap/Ratio";
import { RouteComponentProps, withRouter } from "react-router-dom";

type ActivityProps = RouteComponentProps<{
  activityId: string;
}>;
function Activity(props: ActivityProps) {
  const auth = useAuth();

  const [activity, setActivity] = useState<ActivityState | null>(null);

  useEffect(() => {
    async function fetchData() {
      setActivity(
        await fetchActivity(Number(props.match.params.activityId), {
          idToken: (await auth.users?.fb?.getIdToken()) as string,
          includeAscents: true,
        })
      );
    }
    fetchData();
  }, [auth.users?.fb, props.match.params.activityId]);

  return activity ? (
    <Stack gap={3}>
      <Ratio aspectRatio="21x9">
        <GoogleMap
          path={activity.path}
          secondaries={activity.ascents?.map(
            (ascent: AscentState) => ascent.mountain as MountainState
          )}
        />
      </Ratio>
      <h2>{activity.name}</h2>
      <h4>{activity.date.toLocaleString()}</h4>
      {activity.source === "strava" && (
        <h4>
          <a href={"http://www.strava.com/activities/" + activity.sourceId}>
            Sourced from Strava
          </a>
        </h4>
      )}
      {activity.description && <p>{activity.description}</p>}
      {activity.ascents && (
        // TODO: Come up with some way of sorting the ascents by the order in
        // which they happend during the activity.
        <AscentList
          ascents={activity.ascents}
          count={activity.ascents.length}
          fetchMoreAscents={() => {}}
          pageLength={activity.ascents.length}
        />
      )}
    </Stack>
  ) : (
    <></>
  );
}

export default withRouter(Activity);
