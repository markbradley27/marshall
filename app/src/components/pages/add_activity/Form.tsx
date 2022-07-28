import { InvalidTooltip } from "components/shared/InvalidTooltip";
import { useAuth } from "contexts/auth";
import { Formik, FormikErrors } from "formik";
import { useCallback, useRef } from "react";
import { Form, Stack } from "react-bootstrap";

import FileDependentFields from "./FileDependentFields";
import { Values } from "./FormikValues";

export default function AddActivityForm() {
  const auth = useAuth();

  const fileControl = useRef<HTMLInputElement>(null);

  const validate = useCallback((values) => {
    const errors: FormikErrors<Values> = {};
    if (values.file != null && !values.file.name.endsWith("gpx")) {
      errors.file = "Only gpx files supported";
    }
    return errors;
  }, []);

  const submit = useCallback(() => {}, []);

  return (
    <Formik
      initialValues={
        {
          file: null,
          name: "",
          date: "",
          time: "",
          privacy: auth.users?.db?.defaultActivityPrivacy,
        } as Values
      }
      onSubmit={submit}
      validate={validate}
    >
      {({ errors, handleBlur, handleSubmit, setFieldValue, touched }) => (
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
            <FileDependentFields />
          </Stack>
        </Form>
      )}
    </Formik>
  );
}
