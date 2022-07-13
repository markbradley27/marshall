import PrivacySettings from "components/pages/settings/PrivacySettings";
import ProfilePhotoEditor from "components/pages/settings/ProfilePhotoEditor";
import ProfileSettings from "components/pages/settings/ProfileSettings";
import StravaSettings from "components/pages/settings/StravaSettings";
import { useAuth } from "contexts/auth";
import { Col, Row } from "react-bootstrap";

export default function Settings() {
  const auth = useAuth();

  return (
    auth.dbUser && (
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
            <ProfileSettings />
          </Col>
        </Row>
        <hr />
        <Row>
          <Col xs={4}>
            <h4>Privacy:</h4>
          </Col>
          <Col xs={8}>
            <PrivacySettings />
          </Col>
        </Row>
        <hr />
        <Row>
          <Col xs={4}>
            <h4>Third party integration:</h4>
          </Col>
          <Col xs={8}>
            <StravaSettings user={auth.dbUser} />
          </Col>
        </Row>
      </>
    )
  );
}
