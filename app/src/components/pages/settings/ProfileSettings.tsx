import { InvalidTooltip } from "components/shared/InvalidTooltip";
import { useAuth } from "contexts/auth";
import { FormEvent, useCallback, useRef, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";

export default function ProfileSettings() {
  const auth = useAuth();

  const [saving, setSaving] = useState(false);
  const [nameModified, setNameModified] = useState(false);
  const nameControl = useRef<HTMLInputElement>(null);
  const [nameInvalid, setNameInvalid] = useState("");
  const [locationModified, setLocationModified] = useState(false);
  const locationControl = useRef<HTMLInputElement>(null);
  const [genderModified, setGenderModified] = useState(false);
  const genderControl = useRef<HTMLSelectElement>(null);
  const [bioModified, setBioModified] = useState(false);
  const bioControl = useRef<HTMLTextAreaElement>(null);

  const save = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      const saveAsync = async () => {
        e.preventDefault();

        var invalid = false;
        if (!nameControl?.current?.value) {
          setNameInvalid("Name required");
          invalid = true;
        } else {
          setNameInvalid("");
        }
        if (invalid) {
          return;
        }

        setSaving(true);
        const updateOpts: any = {};
        if (nameModified) {
          updateOpts.name = nameControl?.current?.value;
        }
        if (locationModified) {
          updateOpts.location = locationControl?.current?.value;
        }
        if (genderModified) {
          updateOpts.gender = genderControl?.current?.value;
        }
        if (bioModified) {
          updateOpts.bio = bioControl?.current?.value;
        }
        await auth.updateDbUser(updateOpts);
        setNameModified(false);
        setLocationModified(false);
        setGenderModified(false);
        setBioModified(false);
        setSaving(false);
      };
      saveAsync();
    },
    [auth, bioModified, genderModified, locationModified, nameModified]
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
              defaultValue={auth.users?.db?.name}
              isInvalid={nameInvalid !== ""}
              onChange={() => {
                setNameModified(true);
              }}
              ref={nameControl}
              type="text"
            />
          </Col>
          <InvalidTooltip
            error={nameInvalid}
            target={nameControl.current}
            touched={nameModified}
          />
        </Form.Group>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column xs="4">
            Location:
          </Form.Label>
          <Col>
            <Form.Control
              defaultValue={auth.users?.db?.location}
              onChange={() => {
                setLocationModified(true);
              }}
              ref={locationControl}
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
              defaultValue={auth.users?.db?.gender}
              onChange={() => {
                setGenderModified(true);
              }}
              ref={genderControl}
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
              defaultValue={auth.users?.db?.bio}
              onChange={() => {
                setBioModified(true);
              }}
              ref={bioControl}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className="justify-content-center">
          <Col xs="auto">
            <Button
              disabled={
                !(
                  nameModified ||
                  locationModified ||
                  genderModified ||
                  bioModified
                ) || saving
              }
              type="submit"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </Col>
        </Form.Group>
      </Form>
    </>
  );
}
