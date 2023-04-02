import { PrivacySelector } from "components/shared/form/PrivacySelector";
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
      await auth.updateDbUser({
        defaultActivityPrivacy: e.target.value,
      });
      setSavingDefaultActivityPrivacy(false);
    },
    [auth]
  );

  const onDefaultAscentPrivacyChange = useCallback(
    async (e) => {
      setSavingDefaultAscentPrivacy(true);
      await auth.updateDbUser({
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
              <PrivacySelector
                defaultValue={auth.users?.db?.defaultActivityPrivacy}
                disabled={savingDefaultActivityPrivacy}
                onChange={onDefaultActivityPrivacyChange}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Form.Label column xs={6}>
              Default visibility for new ascents:
            </Form.Label>
            <Col>
              <PrivacySelector
                defaultValue={auth.users?.db?.defaultAscentPrivacy}
                disabled={savingDefaultAscentPrivacy}
                onChange={onDefaultAscentPrivacyChange}
              />
            </Col>
          </Form.Group>
        </Stack>
      </Form>
    </>
  );
}
