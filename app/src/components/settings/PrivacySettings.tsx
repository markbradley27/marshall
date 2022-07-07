import { useCallback, useState } from "react";
import { Col, Form, Row } from "react-bootstrap";

import { UserState } from "../../api_client";
import { useAuth } from "../../contexts/auth";

interface PrivacySettingsProps {
  user: UserState;
}

export default function PrivacySettings(props: PrivacySettingsProps) {
  const [activitiesDefaultPrivate, setActivitiesDefaultPrivate] = useState(
    props.user.activitiesDefaultPrivate
  );
  const [savingActivitiesDefaultPrivate, setSavingActivitiesDefaultPrivate] =
    useState(false);
  const [ascentsDefaultPrivate, setAscentsDefaultPrivate] = useState(
    props.user.ascentsDefaultPrivate
  );
  const [savingAscentsDefaultPrivate, setSavingAscentsDefaultPrivate] =
    useState(false);

  const auth = useAuth();

  const onActivitiesDefaultPrivateChange = useCallback(
    async (e) => {
      setSavingActivitiesDefaultPrivate(true);
      setActivitiesDefaultPrivate(e.target.checked);
      await auth.updateUser({
        activitiesDefaultPrivate: e.target.checked,
      });
      setSavingActivitiesDefaultPrivate(false);
    },
    [auth]
  );

  const onAscentsDefaultPrivateChange = useCallback(
    async (e) => {
      setSavingAscentsDefaultPrivate(true);
      setAscentsDefaultPrivate(e.target.checked);
      await auth.updateUser({
        ascentsDefaultPrivate: e.target.checked,
      });
      setSavingAscentsDefaultPrivate(false);
    },
    [auth]
  );

  return (
    <>
      <Form>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column style={{ textAlign: "right" }} xs={7}>
            New activities are private by default:
          </Form.Label>
          <Col>
            <Form.Switch
              checked={activitiesDefaultPrivate}
              disabled={savingActivitiesDefaultPrivate}
              onChange={onActivitiesDefaultPrivateChange}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className="mb-3 text-right">
          <Form.Label column style={{ textAlign: "right" }} xs={7}>
            New ascents are private by default:
          </Form.Label>
          <Col>
            <Form.Switch
              checked={ascentsDefaultPrivate}
              disabled={savingAscentsDefaultPrivate}
              onChange={onAscentsDefaultPrivateChange}
            />
          </Col>
        </Form.Group>
      </Form>
    </>
  );
}
