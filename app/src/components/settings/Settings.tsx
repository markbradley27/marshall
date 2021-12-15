import { useCallback, useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";

import { UserState, fetchUser } from "../../api_client";
import { useAuth } from "../../contexts/auth";

import StravaSettings from "./StravaSettings";

export default function Settings() {
  const [user, setUser] = useState<UserState | null>(null);
  const [loadAttempted, setLoadAttempted] = useState(false);

  const auth = useAuth();

  const refreshUser = useCallback(async () => {
    const refreshedUser = await fetchUser(
      auth.user?.uid as string,
      auth.idToken
    );
    setUser(refreshedUser);
  }, [auth.idToken, auth.user]);

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
        <Row>
          <Col xs={4}>Third party integration:</Col>
          <Col xs={8}>
            <StravaSettings user={user} refreshUser={refreshUser} />
          </Col>
        </Row>
      </>
    )
  );
}