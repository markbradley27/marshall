import { postList } from "api/list_endpoints";
import { fetchMountains, MountainState } from "api/mountain_endpoints";
import { InvalidTooltip } from "components/shared/InvalidTooltip";
import { PrivacySelector } from "components/shared/form/PrivacySelector";
import MountainList from "components/shared/mountain/MountainList";
import { useAuth } from "contexts/auth";
import { Formik, FormikErrors } from "formik";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Form, Stack } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { useHistory } from "react-router-dom";

interface Values {
  name: string;
  privacy: string;
  description: string;
  mountains: MountainState[];
}

export default function AddListForm() {
  const auth = useAuth();
  const history = useHistory();

  const [mountains, setMountains] = useState<MountainState[]>([]);
  const [alertMessage, setAlertMessage] = useState("");

  const nameControl = useRef<HTMLInputElement>(null);
  const mountainTypeahead = useRef<Typeahead<MountainState>>(null);

  useEffect(() => {
    async function fetchData() {
      setMountains(await fetchMountains());
    }
    fetchData();
  }, []);

  const validate = useCallback((values: Values) => {
    const errors: FormikErrors<Values> = {};

    if (!values.name) {
      errors.name = "Name required";
    }

    if (values.mountains.length <= 1) {
      errors.mountains = "Must add at least two mountains.";
    }

    return errors;
  }, []);

  const submit = useCallback(
    async (values: Values) => {
      try {
        const res = await postList({
          idToken: (await auth.users?.fb?.getIdToken()) as string,
          name: values.name,
          privacy: values.privacy,
          description: values.description,
          mountainIds: values.mountains.map((mountain) => mountain.id),
        });
        history.push(`list/${res.id}`);
      } catch {
        setAlertMessage("Sorry, something went wrong.");
      }
    },
    [auth.users?.fb, history]
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
            name: "",
            // TODO: Use an enum here.
            privacy: "PUBLIC",
            description: "",
            mountains: [],
          } as Values
        }
        onSubmit={submit}
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
          values,
        }) => (
          <Form noValidate onSubmit={handleSubmit}>
            <Stack gap={3}>
              <Form.Group controlId="name">
                <Form.Label>Name:</Form.Label>
                <Form.Control
                  disabled={isSubmitting}
                  isInvalid={touched.name && errors.name != null}
                  ref={nameControl}
                  type="text"
                  {...getFieldProps("name")}
                />
                <InvalidTooltip
                  error={errors.name}
                  target={nameControl.current}
                  touched={touched.name}
                />
              </Form.Group>
              <Stack direction="horizontal" gap={3}>
                <Form.Group>
                  <Form.Label>Visibility</Form.Label>
                  <PrivacySelector
                    disabled={isSubmitting}
                    {...getFieldProps("privacy")}
                  />
                </Form.Group>
              </Stack>
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
              <Form.Group controlId="mountain">
                <Form.Label>Mountains</Form.Label>
                <Stack gap={3}>
                  <Typeahead
                    disabled={mountains.length === 0 || isSubmitting}
                    id="mountain"
                    labelKey="name"
                    // TODO: Ignore duplicates.
                    onChange={(selected) => {
                      if (
                        values.mountains.filter(
                          (mountain) => mountain.id === selected[0].id
                        ).length === 0
                      ) {
                        setFieldValue("mountains", [
                          ...values.mountains,
                          selected[0],
                        ]);
                      }
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
                    emptyPlaceholder="List is empty."
                    mountains={values.mountains}
                    namesAreLinks={false}
                    removeMountain={(toRemove: MountainState) => {
                      setFieldTouched("mountains");
                      setFieldValue(
                        "mountains",
                        values.mountains.filter((mountain) => {
                          return mountain.id !== toRemove.id;
                        })
                      );
                    }}
                    isInvalid={touched.mountains && errors.mountains != null}
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
        )}
      </Formik>
    </>
  );
}
