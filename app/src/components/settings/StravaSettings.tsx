import { useCallback } from "react";
import { Button, Image } from "react-bootstrap";

import { apiFetch, UserState } from "../../api_client";
import { useAuth } from "../../contexts/auth";

interface StravaSettingsProps {
  user: UserState;
  refreshUser: () => void;
}

export default function StravaSettings(props: StravaSettingsProps) {
  const auth = useAuth();

  const deauthorizeStrava = useCallback(async () => {
    await apiFetch("/api/strava/deauthorize", await auth.user?.getIdToken());
    props.refreshUser();
  }, [props, auth]);

  return (
    <>
      {props.user.stravaAthleteId != null ? (
        <>
          <span className="align-middle">
            Synced to{" "}
            <a
              href={
                "http://www.strava.com/athletes/" + props.user.stravaAthleteId
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
          href={`http://www.strava.com/oauth/authorize?client_id=${process.env.REACT_APP_STRAVA_CLIENT_ID}&redirect_uri=http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/strava/authorize_callback&response_type=code&scope=activity:read,activity:read_all&state=${auth.user?.uid}`}
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
