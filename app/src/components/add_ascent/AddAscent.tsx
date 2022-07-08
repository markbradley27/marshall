import { useCallback, useEffect, useState } from "react";
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
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [privacy, setPrivacy] = useState(auth.dbUser?.defaultAscentPrivacy);
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

  const onPrivacyChange = useCallback((e) => {
    setPrivacy(e.target.value);
  }, []);

  const submitAscent = useCallback(
    async (e) => {
      e.preventDefault();
      if (mountain == null || date == null) {
        return;
      }

      let dateToPost = date;
      if (time) {
        dateToPost += "T" + time;
      }
      setSubmitting(true);
      await postAscent(
        (await auth.fbUser?.getIdToken()) as string,
        privacy as string,
        dateToPost,
        mountain.id
      );
      // TODO: Redirect to ascent page once it exists.
      props.history.push("/mountain/" + mountain.id);
    },
    [auth.fbUser, date, mountain, privacy, props.history, time]
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
              <Form.Control
                type="date"
                onChange={(e) => {
                  setDate(e.target.value);
                }}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Time</Form.Label>
              <Form.Control
                type="time"
                onChange={(e) => {
                  setTime(e.target.value);
                }}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Privacy</Form.Label>
              <Form.Select
                defaultValue={auth.dbUser?.defaultAscentPrivacy}
                onChange={onPrivacyChange}
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