import { useCallback, useEffect, useState } from "react";
import { Button, Col, Row } from "react-bootstrap";

import { apiFetch, UserState, fetchUser } from "../api_shim";
import { useAuth } from "../contexts/auth";

export default function Settings() {
  const [user, setUser] = useState<UserState | null>(null);
  const auth = useAuth();

  const refreshUser = useCallback(async () => {
    console.log("Refreshing user:", user);
    const idToken = (await auth.user?.getIdToken()) as string;
    const refreshedUser = await fetchUser(auth.user?.uid as string, idToken);
    setUser(refreshedUser);
    console.log("Refreshed user:", refreshedUser);
  }, [user, auth.user]);

  useEffect(() => {
    async function fetchData() {
      await refreshUser();
    }
    if (user == null) {
      fetchData();
    }
  });

  const deauthorize = useCallback(async () => {
    const idToken = (await auth.user?.getIdToken()) as string;
    await apiFetch("/api/strava/deauthorize", idToken);
    await refreshUser();
  }, [refreshUser, auth.user]);

  return (
    user && (
      <>
        <h3>Settings:</h3>
        <Row>
          <Col xs={4}>Third party integration:</Col>
          <Col xs={8}>
            {user.stravaAthleteId != null ? (
              <>
                Synced to{" "}
                <a
                  href={
                    "http://www.strava.com/athletes/" + user.stravaAthleteId
                  }
                >
                  strava account
                </a>
                .
                <br />
                <Button className="mt-2" onClick={deauthorize}>
                  Deauthorize Strava
                </Button>
              </>
            ) : (
              <Button
                style={{
                  backgroundColor: "#fc4c02",
                  borderColor: "#fc4c02",
                }}
                href={`http://www.strava.com/oauth/authorize?client_id=${process.env.REACT_APP_STRAVA_CLIENT_ID}&redirect_uri=http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/strava/authorize_callback&response_type=code&scope=activity:read,activity:read_all&state=${auth.user?.uid}`}
              >
                Sync strava
              </Button>
            )}
          </Col>
        </Row>
      </>
    )
  );
}
