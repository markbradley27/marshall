import { postActivity } from "api/activity_endpoints";
import { fetchMountains, MountainState } from "api/mountain_endpoints";
import { InvalidTooltip } from "components/shared/InvalidTooltip";
import MountainList from "components/shared/mountain/MountainList";
import { useAuth } from "contexts/auth";
import { Formik, FormikErrors } from "formik";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Form, Stack } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { dateTimeAreInFuture } from "validation";

import FileDependentFields from "./FileDependentFields";
import { Values } from "./FormikValues";

export default function AddActivityForm() {
  const auth = useAuth();

  const [mountains, setMountains] = useState<MountainState[]>([]);

  const [alertMessage, setAlertMessage] = useState("");

  const fileControl = useRef<HTMLInputElement>(null);
  const mountainTypeahead = useRef<Typeahead<MountainState>>(null);

  useEffect(() => {
    async function fetchData() {
      setMountains(await fetchMountains());
    }
    fetchData();
  }, []);

  const validate = useCallback((values: Values) => {
    const errors: FormikErrors<Values> = {};
    if (values.file != null && !values.file.name.endsWith("gpx")) {
      errors.file = "Only gpx files supported";
    }
    if (!values.name) {
      errors.name = "Name required";
    }
    if (!values.date) {
      errors.date = "Date required";
    }

    // Date/time in the future
    // TODO: Revisit time zone.
    if (
      values.date &&
      dateTimeAreInFuture(
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        values.date,
        values.time
      )
    ) {
      if (values.time) {
        errors.date = "";
        errors.time = "Time must be in the past";
      } else {
        errors.date = "Date must be in the past";
      }
    }

    if (values.ascended.length === 0) {
      errors.ascended = "Must include at least one ascent.";
    }

    return errors;
  }, []);

  const submit = useCallback(
    async (values: Values) => {
      try {
        const res = await postActivity({
          idToken: (await auth.users?.fb?.getIdToken()) as string,
          privacy: values.privacy,
          name: values.name,
          date: values.date,
          time: values.time,
          // TODO: Think about time zones some more...
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          path: values.path,
          description: values.description,
          ascendedMountainIds: values.ascended.map((mountain) => mountain.id),
        });
        setAlertMessage(
          `Some day this will redirect to the activity page. Until then, you just get an id: ${res.id}`
        );
      } catch {
        setAlertMessage("Sorry, something went wrong.");
      }
    },
    [auth.users?.fb]
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
        initialValues={
          {
            file: null,
            path: undefined,
            suggested: [],
            name: "",
            date: "",
            time: "",
            privacy: auth.users?.db?.defaultActivityPrivacy,
            description: "",
            ascended: [],
          } as Values
        }
        onSubmit={submit}
        validate={validate}
      >
        {({
          errors,
          getFieldProps,
          handleBlur,
          handleSubmit,
          isSubmitting,
          setFieldTouched,
          setFieldValue,
          touched,
          values,
        }) => {
          const suggestionsToDisplay = values.suggested.filter(
            (suggestion) =>
              !values.ascended.some((ascent) => ascent.id === suggestion.id)
          );
          return (
            <Form noValidate onSubmit={handleSubmit}>
              <Stack gap={3}>
                <Form.Group>
                  <Form.Label>
                    Track File <span className="text-muted">(optional)</span>
                  </Form.Label>
                  <Form.Control
                    disabled={isSubmitting}
                    isInvalid={touched.file && errors.file != null}
                    name="file"
                    onBlur={handleBlur}
                    onChange={(e) => {
                      const target = (e.target as HTMLInputElement) || null;
                      if (target?.files != null) {
                        setFieldValue("file", target.files[0]);
                      }
                    }}
                    ref={fileControl}
                    type="file"
                  ></Form.Control>
                  <InvalidTooltip
                    error={errors.file}
                    target={fileControl.current}
                    touched={touched.file}
                  />
                </Form.Group>
                <Form.Group>
                  {suggestionsToDisplay.length !== 0 && (
                    <>
                      <Form.Label>Suggested ascents along route:</Form.Label>
                      <MountainList
                        mountains={suggestionsToDisplay}
                        namesAreLinks={false}
                        removeMountain={(toRemove: MountainState) => {
                          setFieldValue(
                            "suggested",
                            values.suggested.filter((suggestion) => {
                              return suggestion.id !== toRemove.id;
                            })
                          );
                        }}
                        confirmMountain={(toConfirm: MountainState) => {
                          setFieldValue(
                            "suggested",
                            values.suggested.filter((suggestion) => {
                              return suggestion.id !== toConfirm.id;
                            })
                          );
                          setFieldValue("ascended", [
                            ...values.ascended,
                            toConfirm,
                          ]);
                        }}
                        mountainVariant={() => "warning"}
                      />
                    </>
                  )}
                </Form.Group>
                <FileDependentFields />
                <Form.Group>
                  <Form.Label>
                    Description <span className="text-muted">(optional)</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    disabled={isSubmitting}
                    {...getFieldProps("description")}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Ascents</Form.Label>
                  <Stack gap={3}>
                    <Typeahead
                      disabled={mountains.length === 0 || isSubmitting}
                      id="mountain"
                      labelKey="name"
                      onChange={(selected) => {
                        setFieldValue("ascended", [
                          ...values.ascended,
                          selected[0],
                        ]);
                        mountainTypeahead.current?.clear();
                      }}
                      options={mountains}
                      placeholder={
                        mountains.length === 0
                          ? "Loading..."
                          : "Search by mountain name..."
                      }
                      ref={mountainTypeahead}
                    />
                    <MountainList
                      emptyPlaceholder="Ascents list is empty."
                      mountains={values.ascended}
                      namesAreLinks={false}
                      removeMountain={(toRemove: MountainState) => {
                        setFieldTouched("ascended");
                        setFieldValue(
                          "ascended",
                          values.ascended.filter((ascended) => {
                            return ascended.id !== toRemove.id;
                          })
                        );
                      }}
                      isInvalid={touched.ascended && errors.ascended != null}
                    />
                  </Stack>
                </Form.Group>
                <Button
                  className={"w-100" + (isSubmitting ? " disabled" : "")}
                  type="submit"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </Stack>
            </Form>
          );
        }}
      </Formik>
    </>
  );
}
