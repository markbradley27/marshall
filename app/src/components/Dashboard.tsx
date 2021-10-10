import { useCallback, useEffect, useState } from "react";
import Container from "react-bootstrap/Container";

import { useAuth } from "../contexts/auth";
import ActivityList from "./ActivityList";
import AscentList from "./AscentList";
import {
  fetchActivities,
  fetchAscents,
  ActivityState,
  AscentState,
} from "../api_shim";
import useGoogleMaps from "../hooks/loadGoogleMaps";

export default function Dashboard() {
  const [ascents, setAscents] = useState<AscentState[] | null>(null);
  const [onlyActivitiesWithAscents, setOnlyActivitiesWithAscents] =
    useState(true);
  const [activities, setActivities] = useState<ActivityState[] | null>(null);

  const auth = useAuth();
  const googleMapsLoaded = useGoogleMaps();

  const refreshAscents = useCallback(async (idToken: string) => {
    const ascents = await fetchAscents({
      idToken,
      includeMountains: true,
    });
    setAscents(ascents);
  }, []);

  const refreshActivities = useCallback(
    async (idToken: string, onlyWithAscents: boolean) => {
      const activities = await fetchActivities({
        idToken,
        onlyWithAscents,
      });
      setActivities(activities);
    },
    []
  );

  useEffect(() => {
    async function fetchData() {
      const idToken = (await auth.user?.getIdToken()) as string;
      await refreshAscents(idToken);
      await refreshActivities(idToken, onlyActivitiesWithAscents);
    }

    if ((ascents == null || activities == null) && googleMapsLoaded) {
      fetchData();
    }
  });

  const toggleOnlyActivitiesWithAscents = useCallback(async () => {
    console.log(
      "toggleOnlyActivitiesWithAscents called:",
      onlyActivitiesWithAscents
    );
    setOnlyActivitiesWithAscents(!onlyActivitiesWithAscents);
    const idToken = (await auth.user?.getIdToken()) as string;
    // TODO: Figure out why I need to pass in onlyActivities.. (if I don't it
    // does the opposite each time).
    refreshActivities(idToken, !onlyActivitiesWithAscents);
  }, [onlyActivitiesWithAscents, auth.user, refreshActivities]);

  return (
    ascents &&
    activities && (
      <Container>
        <h3> Welcome {auth.user?.displayName}</h3>
        <AscentList title="Your ascents:" ascents={ascents} />
        <ActivityList
          title="Your activities:"
          activities={activities}
          onlyActivitiesWithAscents={onlyActivitiesWithAscents}
          toggleOnlyActivitiesWithAscents={toggleOnlyActivitiesWithAscents}
        />
      </Container>
    )
  );
}
