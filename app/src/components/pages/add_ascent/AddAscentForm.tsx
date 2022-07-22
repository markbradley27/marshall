import { postAscent } from "api/ascent_endpoints";
import { fetchMountains, MountainState } from "api/mountain_endpoints";
import { useAuth } from "contexts/auth";
import useGoogleMaps from "hooks/loadGoogleMaps";
import { DateTime } from "luxon";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Form, Stack } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";

interface AddAscentFormProps {
  reportAdded: (id: number) => void;
}

export default function AddAscentForm(props: AddAscentFormProps) {
  const auth = useAuth();

  const [mountains, setMountains] = useState<MountainState[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [mountain, setMountain] = useState<MountainState | null>(null);
  const [mountainInvalid, setMountainInvalid] = useState(false);
  const dateControl = useRef<HTMLInputElement>(null);
  const [dateInvalid, setDateInvalid] = useState(false);
  const timeControl = useRef<HTMLInputElement>(null);
  const [timeInvalid, setTimeInvalid] = useState(false);
  const privacySelect = useRef<HTMLSelectElement>(null);

  const [submitting, setSubmitting] = useState(false);

  const googleMapsLoaded = useGoogleMaps();

  useEffect(() => {
    async function fetchData() {
      setLoaded(true);
      setMountains(await fetchMountains());
    }

    if (!loaded && googleMapsLoaded) {
      fetchData();
    }
  });

  const submitAscent = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate input
      if (mountain == null) {
        setMountainInvalid(true);
        return;
      } else {
        setMountainInvalid(false);
      }
      if (!dateControl?.current?.value) {
        setDateInvalid(true);
        return;
      } else {
        const dateTime = DateTime.fromISO(
          timeControl?.current?.value
            ? dateControl?.current?.value + "T" + timeControl?.current?.value
            : dateControl?.current?.value,
          { zone: mountain?.timeZone }
        );
        if (dateTime > DateTime.now()) {
          setDateInvalid(true);
          if (timeControl?.current?.value) {
            setTimeInvalid(true);
          }
          return;
        } else {
          setDateInvalid(false);
          setTimeInvalid(false);
        }
      }

      // Submit
      setSubmitting(true);
      const res = await postAscent(
        (await auth.users?.fb?.getIdToken()) as string,
        privacySelect?.current?.value as string,
        dateControl?.current?.value as string,
        mountain?.id as number,
        timeControl?.current?.value ? timeControl?.current?.value : undefined
      );
      setSubmitting(false);
      props.reportAdded(res.id);
    },
    [auth.users?.fb, mountain, props]
  );

  return mountains != null ? (
    <Form onSubmit={submitAscent}>
      <Stack gap={3}>
        <Form.Group controlId="mountain">
          <Form.Label>Mountain</Form.Label>
          <Typeahead
            id="mountain"
            isInvalid={mountainInvalid}
            labelKey="name"
            options={mountains}
            placeholder="Search by mountain name..."
            onChange={(selected) => {
              setMountain(selected[0]);
            }}
          />
        </Form.Group>
        <Stack direction="horizontal" gap={3}>
          <Form.Group controlId="date">
            <Form.Label>Date</Form.Label>
            <Form.Control
              isInvalid={dateInvalid}
              ref={dateControl}
              type="date"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Time</Form.Label>
            <Form.Control
              isInvalid={timeInvalid}
              ref={timeControl}
              type="time"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Visibility</Form.Label>
            <Form.Select
              defaultValue={auth.users?.db?.defaultAscentPrivacy}
              ref={privacySelect}
            >
              <option value="PUBLIC">Public</option>
              <option value="FOLLOWERS_ONLY">Followers Only</option>
              <option value="PRIVATE">Private</option>
            </Form.Select>
          </Form.Group>
        </Stack>
        <Button
          className={"w-100" + (submitting ? " disabled" : "")}
          type="submit"
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </Stack>
    </Form>
  ) : (
    <></>
  );
}
