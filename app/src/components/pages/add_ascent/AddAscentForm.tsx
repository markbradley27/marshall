import { postAscent } from "api/ascent_endpoints";
import { fetchMountains, MountainState } from "api/mountain_endpoints";
import { InvalidTooltip } from "components/shared/InvalidTooltip";
import { PrivacySelector } from "components/shared/form/PrivacySelector";
import { useAuth } from "contexts/auth";
import { Formik } from "formik";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Form, Stack } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { dateTimeAreInFuture } from "validation";

interface AddAscentFormProps {
  reportAdded: (id: number) => void;
}

export default function AddAscentForm(props: AddAscentFormProps) {
  const auth = useAuth();

  const [mountains, setMountains] = useState<MountainState[]>([]);
  const [alertMessage, setAlertMessage] = useState("");

  const [typeaheadFocused, setTypeaheadFocused] = useState(false);
  const mountainTypeahead = useRef<Typeahead<MountainState> | null>(null);
  const mountainTypeaheadWrapper = useRef<HTMLElement | null>(null);
  const dateControl = useRef<HTMLInputElement>(null);
  const timeControl = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      setMountains(await fetchMountains());
    }
    fetchData();
  }, []);

  const validate = useCallback((values) => {
    const errors = {} as any;

    // Empty checks.
    if (values.mountain == null) {
      errors.mountain = "Mountain required";
    }
    if (!values.date) {
      errors.date = "Date required";
    }

    // Date/time in the future
    if (
      values.mountain != null &&
      values.date &&
      dateTimeAreInFuture(values.mountain.timeZone, values.date, values.time)
    ) {
      if (values.time) {
        errors.date = "";
        errors.time = "Time must be in the past";
      } else {
        errors.date = "Date must be in the past";
      }
    }

    return errors;
  }, []);

  const submitAscent = useCallback(
    async (values, { resetForm }) => {
      try {
        const res = await postAscent(
          (await auth.users?.fb?.getIdToken()) as string,
          values.privacy,
          values.date,
          values.mountain.id,
          values.time !== "" ? values.time : undefined
        );
        mountainTypeahead?.current?.clear();
        resetForm();
        props.reportAdded(res.id);
      } catch {
        setAlertMessage("Sorry, something went wrong.");
      }
    },
    [auth.users?.fb, props]
  );

  return (
    <>
      {alertMessage && (
        <Alert
          className="text-center"
          dismissible
          onClose={() => {
            setAlertMessage("");
          }}
          variant="danger"
        >
          {alertMessage}
        </Alert>
      )}
      <Formik
        initialValues={{
          mountain: undefined,
          date: "",
          time: "",
          privacy: auth.users?.db?.defaultAscentPrivacy,
        }}
        onSubmit={submitAscent}
        validate={validate}
      >
        {({
          errors,
          getFieldProps,
          handleSubmit,
          isSubmitting,
          setFieldTouched,
          setFieldValue,
          touched,
        }) => (
          <Form
            noValidate
            onSubmit={(...args) => {
              handleSubmit(...args);
              // Bit of a hack; without this, touched.mountain will be
              // undefined if the mountain typeahead has been touched but then
              // cleared. Don't know why, but this works around it.
              setFieldTouched("mountain");
            }}
          >
            <Stack gap={3}>
              <Form.Group controlId="mountain">
                <Form.Label>Mountain</Form.Label>
                <span ref={mountainTypeaheadWrapper}>
                  <Typeahead
                    disabled={mountains.length === 0 || isSubmitting}
                    id="mountain"
                    isInvalid={
                      !typeaheadFocused &&
                      touched.mountain &&
                      errors.mountain != null
                    }
                    labelKey="name"
                    onBlur={() => {
                      setTypeaheadFocused(false);
                      // handleBlur doesn't seem to handle mountain being an
                      // object well, so I just set the field touched directly.
                      setFieldTouched("mountain");
                    }}
                    onChange={(selected) => {
                      setFieldValue(
                        "mountain",
                        selected[0] != null ? selected[0] : undefined
                      );
                    }}
                    onFocus={() => {
                      setTypeaheadFocused(true);
                    }}
                    options={mountains}
                    placeholder={
                      mountains.length === 0
                        ? "Loading..."
                        : "Search by mountain name..."
                    }
                    ref={mountainTypeahead}
                  />
                </span>
                {!typeaheadFocused && (
                  <InvalidTooltip
                    error={errors.mountain}
                    target={mountainTypeaheadWrapper.current}
                    touched={touched.mountain}
                  />
                )}
              </Form.Group>
              <Stack direction="horizontal" gap={3}>
                <Form.Group className="position-relative" controlId="date">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    disabled={isSubmitting}
                    isInvalid={touched.date && errors.date != null}
                    ref={dateControl}
                    type="date"
                    {...getFieldProps("date")}
                  />
                  {!typeaheadFocused && (
                    <InvalidTooltip
                      error={errors.date}
                      target={dateControl.current}
                      touched={touched.date}
                    />
                  )}
                </Form.Group>
                <Form.Group>
                  <Form.Label>
                    Time <span className="text-muted">(optional)</span>
                  </Form.Label>
                  <Form.Control
                    disabled={isSubmitting}
                    isInvalid={touched.time && errors.time != null}
                    ref={timeControl}
                    type="time"
                    {...getFieldProps("time")}
                  />
                  {!typeaheadFocused && (
                    <InvalidTooltip
                      error={errors.time}
                      target={timeControl.current}
                      touched={touched.time}
                    />
                  )}
                </Form.Group>
                <Form.Group>
                  <Form.Label>Visibility</Form.Label>
                  <PrivacySelector
                    disabled={isSubmitting}
                    {...getFieldProps("privacy")}
                  />
                </Form.Group>
              </Stack>
              <Button
                className={"w-100" + (isSubmitting ? " disabled" : "")}
                type="submit"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </>
  );
}
