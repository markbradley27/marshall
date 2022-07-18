import {
  fetchActivities,
  //fetchAscents,
  ActivityState,
  //AscentState,
} from "api_client";
import ActivityList from "components/ActivityList";
import UserStats from "components/UserStats";
import { useAuth } from "contexts/auth";
import useGoogleMaps from "hooks/loadGoogleMaps";
import { useCallback, useEffect, useState } from "react";

//import AscentList from "./shared/ascent/AscentList";

export default function Dashboard() {
  //  const [ascents, setAscents] = useState<AscentState[] | null>(null);
  const [onlyActivitiesWithAscents, setOnlyActivitiesWithAscents] =
    useState(true);
  const [activities, setActivities] = useState<ActivityState[] | null>(null);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);

  const auth = useAuth();
  const googleMapsLoaded = useGoogleMaps();

  /*
  const refreshAscents = useCallback(async (idToken: string) => {
    const ascents = await fetchAscents({
      idToken,
      includeMountains: true,
    });
    setAscents(ascents.ascents);
  }, []);
  */

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
      if (!googleMapsLoaded || initialLoadAttempted || auth.users?.fb == null)
        return;

      const idToken = (await auth.users?.fb?.getIdToken()) as string;
      //      await refreshAscents(idToken);
      await refreshActivities(idToken, onlyActivitiesWithAscents);
      setInitialLoadAttempted(true);
    }
    fetchData();
  }, [
    initialLoadAttempted,
    googleMapsLoaded,
    refreshActivities,
    onlyActivitiesWithAscents,
    auth.users,
  ]);

  const toggleOnlyActivitiesWithAscents = useCallback(async () => {
    console.log(
      "toggleOnlyActivitiesWithAscents called:",
      onlyActivitiesWithAscents
    );
    setOnlyActivitiesWithAscents(!onlyActivitiesWithAscents);
    const idToken = (await auth.users?.fb?.getIdToken()) as string;
    // TODO: Figure out why I need to pass in onlyActivities.. (if I don't it
    // does the opposite each time).
    refreshActivities(idToken, !onlyActivitiesWithAscents);
  }, [onlyActivitiesWithAscents, auth.users, refreshActivities]);

  return (
    <>
      <UserStats />
      {/*
      {ascents && <AscentList ascents={ascents} />}
      */}
      {activities && (
        <ActivityList
          title="Your activities:"
          activities={activities}
          onlyActivitiesWithAscents={onlyActivitiesWithAscents}
          toggleOnlyActivitiesWithAscents={toggleOnlyActivitiesWithAscents}
        />
      )}
    </>
  );
}
