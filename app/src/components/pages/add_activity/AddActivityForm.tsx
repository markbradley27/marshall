import { fetchMountains, MountainState } from "api/mountain_endpoints";
import { InvalidTooltip } from "components/shared/InvalidTooltip";
import MountainList from "components/shared/mountain/MountainList";
import { useAuth } from "contexts/auth";
import { Formik, FormikErrors } from "formik";
import { useCallback, useEffect, useRef, useState } from "react";
import { Form, Stack } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";

import FileDependentFields from "./FileDependentFields";
import { Values } from "./FormikValues";

export default function AddActivityForm() {
  const auth = useAuth();

  const [mountains, setMountains] = useState<MountainState[]>([]);
  const [suggested, setSuggested] = useState<MountainState[]>([]);
  const [ascended, setAscended] = useState<MountainState[]>([]);

  const fileControl = useRef<HTMLInputElement>(null);
  const mountainTypeahead = useRef<Typeahead<MountainState>>(null);

  useEffect(() => {
    async function fetchData() {
      setMountains(await fetchMountains());
    }
    fetchData();
  }, []);

  const confirmSuggested = useCallback((toConfirm: MountainState) => {
    setSuggested((suggested) =>
      suggested.filter((suggestion) => {
        return suggestion.id !== toConfirm.id;
      })
    );
    setAscended((ascended) => [...ascended, toConfirm]);
  }, []);

  const removeSuggested = useCallback(
    (toRemove: MountainState) => {
      setSuggested((suggested) =>
        suggested.filter((suggestion) => {
          return suggestion.id !== toRemove.id;
        })
      );
    },
    [setSuggested]
  );

  const removeAscent = useCallback(
    (toRemove: MountainState) => {
      setAscended((ascended) =>
        ascended.filter((ascendedMtn) => {
          return ascendedMtn.id !== toRemove.id;
        })
      );
    },
    [setAscended]
  );

  const validate = useCallback((values) => {
    const errors: FormikErrors<Values> = {};
    if (values.file != null && !values.file.name.endsWith("gpx")) {
      errors.file = "Only gpx files supported";
    }
    return errors;
  }, []);

  const submit = useCallback(() => {}, []);

  const suggestionsToDisplay = suggested.filter(
    (suggestion) => !ascended.some((ascent) => ascent.id === suggestion.id)
  );
  return (
    <Formik
      initialValues={
        {
          file: null,
          name: "",
          date: "",
          time: "",
          privacy: auth.users?.db?.defaultActivityPrivacy,
          description: "",
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
        setFieldValue,
        touched,
      }) => (
        <Form noValidate onSubmit={handleSubmit}>
          <Stack gap={3}>
            <Form.Group>
              <Form.Label>Track file</Form.Label>
              <Form.Control
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
            <FileDependentFields suggestMountains={setSuggested} />
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" {...getFieldProps("description")} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Ascents</Form.Label>
              <Stack gap={3}>
                <Typeahead
                  disabled={mountains.length === 0}
                  id="mountain"
                  labelKey="name"
                  onChange={(selected) => {
                    setAscended((ascended) => [...ascended, selected[0]]);
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
                {suggestionsToDisplay.length !== 0 && (
                  <>
                    <div>Suggested mountains along route:</div>
                    <MountainList
                      mountains={suggestionsToDisplay}
                      namesAreLinks={false}
                      removeMountain={removeSuggested}
                      confirmMountain={confirmSuggested}
                      mountainVariant={() => "warning"}
                    />
                  </>
                )}
                <MountainList
                  emptyPlaceholder="Ascents list is empty."
                  mountains={ascended}
                  namesAreLinks={false}
                  removeMountain={removeAscent}
                />
              </Stack>
            </Form.Group>
          </Stack>
        </Form>
      )}
    </Formik>
  );
}
