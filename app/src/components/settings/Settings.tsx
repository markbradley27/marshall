import { Col, Row } from "react-bootstrap";

import { useAuth } from "../../contexts/auth";

import PrivacySettings from "./PrivacySettings";
import ProfilePhotoEditor from "./ProfilePhotoEditor";
import ProfileSettings from "./ProfileSettings";
import StravaSettings from "./StravaSettings";

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
