import { gpx as gpxToGeoJson } from "@tmcw/togeojson";
import { fetchMountains, MountainState } from "api/mountain_endpoints";
import { InvalidTooltip } from "components/shared/InvalidTooltip";
import { FormikContextType, useFormikContext } from "formik";
import { DateTime } from "luxon";
import { useEffect, useRef } from "react";
import { Form, Stack } from "react-bootstrap";

import { Values } from "./FormikValues";

interface FileDependentFieldsProps {
  suggestMountains: (suggested: MountainState[]) => void;
}
export default function FileDependentFields(props: FileDependentFieldsProps) {
  const { suggestMountains } = props;
  const {
    errors,
    getFieldProps,
    setFieldValue,
    touched,
    values,
  }: FormikContextType<Values> = useFormikContext();

  const nameControl = useRef<HTMLInputElement>(null);
  const dateControl = useRef<HTMLInputElement>(null);
  const timeControl = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!values.file?.name.endsWith("gpx")) {
      return;
    }

    const gpxFr = new FileReader();
    gpxFr.onload = async () => {
      const geoJson = gpxToGeoJson(
        new DOMParser().parseFromString(gpxFr.result as string, "text/xml")
      );

      if (geoJson.features.length === 0) {
        console.warn("No geoJson features found.");
        return;
      }
      if (geoJson.features.length > 1) {
        console.warn("More than one geoJson feature found.");
      }

      for (const feature of geoJson.features) {
        if (feature.geometry.type !== "LineString") {
          continue;
        }

        if (feature.properties?.name) {
          setFieldValue("name", feature.properties?.name);
        }
        if (feature.properties?.time) {
          // TODO: Handle timezone.
          const dateTime = DateTime.fromISO(feature.properties.time);
          setFieldValue("date", dateTime.toFormat("yyyy-MM-dd"));
          setFieldValue("time", dateTime.toFormat("HH:mm"));
        }

        const mountainsAlongPath = await fetchMountains({
          alongPath: feature.geometry,
        });
        suggestMountains(mountainsAlongPath);
      }
    };
    gpxFr.readAsText(values.file);
  }, [suggestMountains, setFieldValue, values.file]);

  return (
    <>
      <Form.Group>
        <Form.Label>Name</Form.Label>
        <Form.Control
          isInvalid={touched.name && errors.name != null}
          ref={nameControl}
          type="text"
          {...getFieldProps("name")}
        />
        <InvalidTooltip
          error={errors.date}
          target={dateControl.current}
          touched={touched.date}
        />
      </Form.Group>
      <Stack direction="horizontal" gap={3}>
        <Form.Group className="position-relative" controlId="date">
          <Form.Label>Date</Form.Label>
          <Form.Control
            isInvalid={touched.date && errors.date != null}
            ref={dateControl}
            type="date"
            {...getFieldProps("date")}
          />
          <InvalidTooltip
            error={errors.date}
            target={dateControl.current}
            touched={touched.date}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>
            Time <span className="text-muted">(optional)</span>
          </Form.Label>
          <Form.Control
            isInvalid={touched.time && errors.time != null}
            ref={timeControl}
            type="time"
            {...getFieldProps("time")}
          />
          <InvalidTooltip
            error={errors.time}
            target={timeControl.current}
            touched={touched.time}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Visibility</Form.Label>
          <Form.Select {...getFieldProps("privacy")}>
            <option value="PUBLIC">Public</option>
            <option value="FOLLOWERS_ONLY">Followers Only</option>
            <option value="PRIVATE">Private</option>
          </Form.Select>
        </Form.Group>
      </Stack>
    </>
  );
}
