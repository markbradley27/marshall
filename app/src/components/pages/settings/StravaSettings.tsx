import { apiFetchJson } from "api/common";
import { useAuth } from "contexts/auth";
import { useCallback } from "react";
import { Button, Image } from "react-bootstrap";

export default function StravaSettings() {
  const auth = useAuth();

  const deauthorizeStrava = useCallback(async () => {
    await apiFetchJson(
      "/api/strava/deauthorize",
      await auth.users?.fb?.getIdToken()
    );
    auth.refreshDbUser();
  }, [auth]);

  return (
    <>
      {auth.users?.db?.stravaAthleteId != null ? (
        <>
          <span className="align-middle">
            Synced to{" "}
            <a
              href={
                "http://www.strava.com/athletes/" +
                auth.users.db.stravaAthleteId
              }
            >
              strava account
            </a>
            .
          </span>
          <Button className="ms-3" onClick={deauthorizeStrava}>
            Deauthorize Strava
          </Button>
        </>
      ) : (
        <Button
          href={`http://www.strava.com/oauth/authorize?client_id=${process.env.REACT_APP_STRAVA_CLIENT_ID}&redirect_uri=http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/strava/authorize_callback&response_type=code&scope=activity:read,activity:read_all&state=${auth.users?.fb?.uid}`}
          style={{
            backgroundColor: "#fc4c02",
            borderColor: "#fc4c02",
          }}
        >
          <span className="align-middle">Sync to </span>
          <Image src="/graphics/strava_logo.svg" style={{ height: 18 }} />
        </Button>
      )}
    </>
  );
}
