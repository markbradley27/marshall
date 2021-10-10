import { useEffect, useState } from "react";
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
  const [activities, setActivities] = useState<ActivityState[] | null>(null);

  const auth = useAuth();
  const googleMapsLoaded = useGoogleMaps();

  useEffect(() => {
    async function fetchData() {
      const idToken = (await auth.user?.getIdToken()) as string;
      const ascents = await fetchAscents({
        idToken,
        includeMountains: true,
      });
      setAscents(ascents);

      const activities = await fetchActivities({
        idToken,
      });
      setActivities(activities);
    }

    if (ascents == null && googleMapsLoaded) {
      fetchData();
    }
  });

  return (
    ascents &&
    activities && (
      <Container>
        <h3> Welcome {auth.user?.displayName}</h3>
        <AscentList title="Your ascents:" ascents={ascents} />
        <ActivityList title="Your activities:" activities={activities} />
      </Container>
    )
  );
}
