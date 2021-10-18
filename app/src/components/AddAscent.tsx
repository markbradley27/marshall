import { Fragment, useCallback, useEffect, useState } from "react";
import { Button, Form, Stack } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";

import { fetchMountains, MountainState, postAscent } from "../api_client";
import { useAuth } from "../contexts/auth";
import useGoogleMaps from "../hooks/loadGoogleMaps";

export default function AddAscent() {
  const [mountains, setMountains] = useState<MountainState[] | null>(null);
  const [mountainsFetchAttempted, setMountainsFetchAttempted] = useState(false);
  const [mountain, setMountain] = useState<MountainState | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const auth = useAuth();
  const googleMapsLoaded = useGoogleMaps();

  useEffect(() => {
    async function fetchData() {
      setMountainsFetchAttempted(true);
      setMountains(await fetchMountains());
    }

    if (!mountainsFetchAttempted && googleMapsLoaded) {
      fetchData();
    }
  });

  // TODO: Redirect to the new ascent page.
  const submitAscent = useCallback(
    (e) => {
      e.preventDefault();
      if (mountain != null && date != null) {
        setSubmitting(true);
        postAscent(auth.idToken, mountain.id, date);
      }
    },
    [auth.idToken, date, mountain]
  );

  return mountains != null ? (
    <Fragment>
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
          {/* TODO: Split time out as optional.*/}
          <Form.Group controlId="date">
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="datetime-local"
              onChange={(e) => {
                setDate(new Date(e.target.value));
              }}
            />
          </Form.Group>
          <Button
            className={"w-100" + (submitting ? " disabled" : "")}
            type="submit"
          >
            Submit
          </Button>
        </Stack>
      </Form>
    </Fragment>
  ) : (
    <></>
  );
}
