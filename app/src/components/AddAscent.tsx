import { Fragment, useCallback, useEffect, useState } from "react";
import { Button, Form, Stack } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";

import { fetchMountains, MountainState, postAscent } from "../api_client";
import { useAuth } from "../contexts/auth";
import useGoogleMaps from "../hooks/loadGoogleMaps";

export default function AddAscent() {
  const [mountains, setMountains] = useState<MountainState[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [mountain, setMountain] = useState<MountainState | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const auth = useAuth();
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

  // TODO: Redirect to the new ascent page.
  const submitAscent = useCallback(
    (e) => {
      e.preventDefault();
      console.log(`mountain: ${mountain}; date: ${date}; time: ${time}`);
      console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
      if (time) {
        console.log(new Date([date, time].join("T")));
      }
      if (mountain != null && date != null) {
        setSubmitting(true);
        //postAscent(auth.idToken, mountain.id, date);
      }
    },
    [auth.idToken, date, mountain, time]
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
          <Stack direction="horizontal" gap={3} className="w-100">
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
          </Stack>
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
