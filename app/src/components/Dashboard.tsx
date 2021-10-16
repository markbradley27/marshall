import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  fetchActivities,
  fetchAscents,
  fetchUser,
  ActivityState,
  AscentState,
  UserState,
} from "../api_shim";
import { useAuth } from "../contexts/auth";
import useGoogleMaps from "../hooks/loadGoogleMaps";

import ActivityList from "./ActivityList";
import AscentList from "./AscentList";
import UserStats from "./UserStats";

export default function Dashboard() {
  const [user, setUser] = useState<UserState | null>(null);
  const [ascents, setAscents] = useState<AscentState[] | null>(null);
  const [onlyActivitiesWithAscents, setOnlyActivitiesWithAscents] =
    useState(true);
  const [activities, setActivities] = useState<ActivityState[] | null>(null);

  const auth = useAuth();
  const googleMapsLoaded = useGoogleMaps();
  const location = useLocation();

  const refreshUser = useCallback(async (uid: string, idToken: string) => {
    const user = await fetchUser(uid, idToken);
    setUser(user);
  }, []);

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
      await refreshUser(auth.user?.uid as string, idToken);
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
    activities &&
    user && (
      <>
        {location.pathname === "/dashboard" && auth.user != null && (
          <UserStats user={user} />
        )}
        {location.pathname === "/ascents" && (
          <AscentList title="Your ascents:" ascents={ascents} />
        )}
        {location.pathname === "/activities" && (
          <ActivityList
            title="Your activities:"
            activities={activities}
            onlyActivitiesWithAscents={onlyActivitiesWithAscents}
            toggleOnlyActivitiesWithAscents={toggleOnlyActivitiesWithAscents}
          />
        )}
      </>
    )
  );
}
