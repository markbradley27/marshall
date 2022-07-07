import geoTz from "geo-tz";
import { DateTime } from "luxon";
import { Fragment, useCallback, useEffect, useState } from "react";
import { Button, Form, Stack } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { fetchMountains, MountainState, postAscent } from "../api_client";
import { useAuth } from "../contexts/auth";
import useGoogleMaps from "../hooks/loadGoogleMaps";

function AddAscent(props: RouteComponentProps<{}>) {
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

  const submitAscent = useCallback(
    async (e) => {
      e.preventDefault();
      let dateTime: DateTime;
      let dateOnly = false;
      if (time) {
        const zone = geoTz(mountain?.coords.lat(), mountain?.coords.lng())[0];
        dateTime = DateTime.fromISO([date, time].join("T"), { zone });
      } else {
        dateTime = DateTime.fromISO(date, { zone: "UTC" });
        dateOnly = true;
      }
      if (mountain != null && date != null) {
        setSubmitting(true);
        await postAscent(
          (await auth.fbUser?.getIdToken()) as string,
          mountain.id,
          dateTime.toJSDate(),
          dateOnly
        );
        // TODO: Redirect to ascent page once it exists.
        props.history.push("/mountain/" + mountain.id);
      }
    },
    [auth.fbUser, date, mountain, props.history, time]
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

export default withRouter(AddAscent);
