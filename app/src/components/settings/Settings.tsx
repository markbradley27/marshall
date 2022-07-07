import { useCallback, useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";

import { UserState, fetchUser } from "../../api_client";
import { useAuth } from "../../contexts/auth";

import PrivacySettings from "./PrivacySettings";
import ProfilePhotoEditor from "./ProfilePhotoEditor";
import ProfileSettings from "./ProfileSettings";
import StravaSettings from "./StravaSettings";

export default function Settings() {
  const [user, setUser] = useState<UserState | null>(null);
  const [loadAttempted, setLoadAttempted] = useState(false);

  const auth = useAuth();

  const refreshUser = useCallback(async () => {
    const refreshedUser = await fetchUser(auth.user?.uid as string, {
      idToken: (await auth.user?.getIdToken()) as string,
    });
    setUser(refreshedUser);
  }, [auth.user]);

  useEffect(() => {
    async function fetchData() {
      if (loadAttempted || user != null) return;
      await refreshUser();
      setLoadAttempted(true);
    }
    fetchData();
  });

  return (
    user && (
      <>
        <h3>Settings:</h3>
        <hr />
        <Row>
          <Col xs={4}>
            <h4>Profile:</h4>
          </Col>
          <Col xs={8}>
            <ProfilePhotoEditor />
            <hr />
            <ProfileSettings user={user} />
          </Col>
        </Row>
        <hr />
        <Row>
          <Col xs={4}>
            <h4>Privacy:</h4>
          </Col>
          <Col xs={8}>
            <PrivacySettings user={user} />
          </Col>
        </Row>
        <hr />
        <Row>
          <Col xs={4}>
            <h4>Third party integration:</h4>
          </Col>
          <Col xs={8}>
            <StravaSettings user={user} refreshUser={refreshUser} />
          </Col>
        </Row>
      </>
    )
  );
}
