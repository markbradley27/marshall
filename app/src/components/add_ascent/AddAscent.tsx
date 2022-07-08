import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Form, Stack } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { fetchMountains, MountainState, postAscent } from "../../api_client";
import { useAuth } from "../../contexts/auth";
import useGoogleMaps from "../../hooks/loadGoogleMaps";

function AddAscent(props: RouteComponentProps<{}>) {
  const auth = useAuth();

  const [mountains, setMountains] = useState<MountainState[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mountain, setMountain] = useState<MountainState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dateControl = useRef<HTMLInputElement>(null);
  const timeControl = useRef<HTMLInputElement>(null);
  const privacySelect = useRef<HTMLSelectElement>(null);

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
      if (mountain == null || dateControl?.current?.value === "") {
        return;
      }

      let dateToPost = dateControl?.current?.value;
      if (timeControl?.current?.value) {
        dateToPost += "T" + timeControl?.current?.value;
      }
      setSubmitting(true);
      await postAscent(
        (await auth.fbUser?.getIdToken()) as string,
        privacySelect?.current?.value as string,
        dateToPost as string,
        mountain.id
      );
      // TODO: Redirect to ascent page once it exists.
      props.history.push("/mountain/" + mountain.id);
    },
    [auth.fbUser, mountain, props.history]
  );

  return mountains != null ? (
    <>
      <h3>Add ascent:</h3>
      <Form onSubmit={submitAscent}>
        <Stack gap={3}>
          <Form.Group controlId="mountain">
            <Form.Label>Mountain</Form.Label>
            <Typeahead
              id="mountain"
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
              <Form.Control ref={dateControl} type="date" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Time</Form.Label>
              <Form.Control ref={timeControl} type="time" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Privacy</Form.Label>
              <Form.Select
                defaultValue={auth.dbUser?.defaultAscentPrivacy}
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
            Submit
          </Button>
        </Stack>
      </Form>
    </>
  ) : (
    <></>
  );
}

export default withRouter(AddAscent);
