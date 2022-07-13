import { useAuth } from "contexts/auth";
import { useCallback, useState } from "react";
import { Col, Form, Row, Stack } from "react-bootstrap";

export default function PrivacySettings() {
  const [savingDefaultActivityPrivacy, setSavingDefaultActivityPrivacy] =
    useState(false);
  const [savingDefaultAscentPrivacy, setSavingDefaultAscentPrivacy] =
    useState(false);

  const auth = useAuth();

  const onDefaultActivityPrivacyChange = useCallback(
    async (e) => {
      setSavingDefaultActivityPrivacy(true);
      await auth.updateUser({
        defaultActivityPrivacy: e.target.value,
      });
      setSavingDefaultActivityPrivacy(false);
    },
    [auth]
  );

  const onDefaultAscentPrivacyChange = useCallback(
    async (e) => {
      setSavingDefaultAscentPrivacy(true);
      await auth.updateUser({
        defaultAscentPrivacy: e.target.value,
      });
      setSavingDefaultAscentPrivacy(false);
    },
    [auth]
  );

  return (
    <>
      <Form>
        <Stack gap={3}>
          <Form.Group as={Row}>
            <Form.Label column xs={6}>
              Default visibility for new activities:
            </Form.Label>
            <Col>
              <Form.Select
                defaultValue={auth.dbUser?.defaultActivityPrivacy}
                disabled={savingDefaultActivityPrivacy}
                onChange={onDefaultActivityPrivacyChange}
              >
                <option value="PUBLIC">Public</option>
                <option value="FOLLOWERS_ONLY">Followers Only</option>
                <option value="PRIVATE">Private</option>
              </Form.Select>
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Form.Label column xs={6}>
              Default visibility for new ascents:
            </Form.Label>
            <Col>
              <Form.Select
                defaultValue={auth.dbUser?.defaultAscentPrivacy}
                disabled={savingDefaultAscentPrivacy}
                onChange={onDefaultAscentPrivacyChange}
              >
                <option value="PUBLIC">Public</option>
                <option value="FOLLOWERS_ONLY">Followers Only</option>
                <option value="PRIVATE">Private</option>
              </Form.Select>
            </Col>
          </Form.Group>
        </Stack>
      </Form>
    </>
  );
}
