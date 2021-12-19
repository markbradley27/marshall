import { FormEvent, useCallback, useState } from "react";
import { Button, Form } from "react-bootstrap";

import { postUser, UserState } from "../../api_client";
import { useAuth } from "../../contexts/auth";

enum SaveState {
  NO_CHANGE,
  MODIFIED,
  SAVING,
}

interface ProfileSettingsProps {
  user: UserState;
}
export default function ProfileSettings(props: ProfileSettingsProps) {
  const [saveState, setSaveState] = useState<SaveState>(SaveState.NO_CHANGE);
  const [name, setName] = useState(props.user.name);

  const auth = useAuth();

  const onChange = useCallback(
    (e) => {
      if (saveState !== SaveState.MODIFIED) {
        setSaveState(SaveState.MODIFIED);
      }
      setName(e.target.value);
    },
    [saveState]
  );

  // TODO: This doesn't propegate updates everywhere. Maybe basic user info
  // should be in the auth context?
  const save = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      const saveAsync = async () => {
        e.preventDefault();
        setSaveState(SaveState.SAVING);
        await postUser(
          props.user.id,
          (await auth.user?.getIdToken()) as string,
          { name }
        );
        setSaveState(SaveState.NO_CHANGE);
      };
      saveAsync();
    },
    [auth, name, props.user.id]
  );

  return (
    <>
      <Form onSubmit={save}>
        <Form.Group>
          <Form.Label>Name:</Form.Label>
          <Form.Control
            onChange={onChange}
            type="text"
            defaultValue={props.user.name}
          />
        </Form.Group>
        <Button disabled={saveState !== SaveState.MODIFIED} type="submit">
          {saveState === SaveState.SAVING ? "Saving..." : "Save"}
        </Button>
      </Form>
    </>
  );
}
