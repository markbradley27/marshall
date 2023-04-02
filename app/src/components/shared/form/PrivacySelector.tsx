import { Form, FormSelectProps } from "react-bootstrap";

// TODO: Use an enum.
export function PrivacySelector(props: FormSelectProps) {
  return (
    <Form.Select {...props}>
      <option value="PUBLIC">Public</option>
      {/*<option value="FOLLOWERS_ONLY">Followers Only</option>*/}
      <option value="PRIVATE">Private</option>
    </Form.Select>
  );
}
