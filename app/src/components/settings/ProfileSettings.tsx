import { FormEvent, useCallback, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";

import { useAuth } from "../../contexts/auth";

enum SaveState {
  NO_CHANGE,
  MODIFIED,
  SAVING,
}

export default function ProfileSettings() {
  const auth = useAuth();

  const [saveState, setSaveState] = useState<SaveState>(SaveState.NO_CHANGE);
  const [name, setName] = useState(auth.dbUser?.name);
  const [location, setLocation] = useState(auth.dbUser?.location);
  const [gender, setGender] = useState(auth.dbUser?.gender);
  const [bio, setBio] = useState(auth.dbUser?.bio);

  const onNameChange = useCallback((e) => {
    setSaveState(SaveState.MODIFIED);
    setName(e.target.value);
  }, []);

  const onLocationChange = useCallback((e) => {
    setSaveState(SaveState.MODIFIED);
    setLocation(e.target.value);
  }, []);

  const onGenderChange = useCallback((e) => {
    setSaveState(SaveState.MODIFIED);
    setGender(e.target.value);
  }, []);

  const onBioChange = useCallback((e) => {
    setSaveState(SaveState.MODIFIED);
    setBio(e.target.value);
  }, []);

  const save = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      const saveAsync = async () => {
        e.preventDefault();
        setSaveState(SaveState.SAVING);
        auth.updateUser({ name, location, gender, bio });
        setSaveState(SaveState.NO_CHANGE);
      };
      saveAsync();
    },
    [auth, bio, gender, location, name]
  );

  return (
    <>
      <Form onSubmit={save}>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column xs="4">
            Name:
          </Form.Label>
          <Col>
            <Form.Control
              defaultValue={auth.dbUser?.name}
              onChange={onNameChange}
              type="text"
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column xs="4">
            Location:
          </Form.Label>
          <Col>
            <Form.Control
              defaultValue={auth.dbUser?.location}
              onChange={onLocationChange}
              type="text"
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column xs="4">
            Gender:
          </Form.Label>
          <Col>
            <Form.Select
              defaultValue={auth.dbUser?.gender}
              onChange={onGenderChange}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non_binary">Non-Binary</option>
              <option value="unspecified">Prefer not to say</option>
            </Form.Select>
          </Col>
        </Form.Group>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column xs="4">
            Bio:
          </Form.Label>
          <Col>
            <Form.Control
              as="textarea"
              defaultValue={auth.dbUser?.bio}
              onChange={onBioChange}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className="justify-content-center">
          <Col xs="auto">
            <Button disabled={saveState !== SaveState.MODIFIED} type="submit">
              {saveState === SaveState.SAVING ? "Saving..." : "Save"}
            </Button>
          </Col>
        </Form.Group>
      </Form>
    </>
  );
}
