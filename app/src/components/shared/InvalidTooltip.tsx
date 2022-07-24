import { Overlay, Tooltip } from "react-bootstrap";

interface InvalidTooltipProps {
  error: string | undefined;
  target: HTMLElement | null;
  touched: boolean | undefined;
}
export function InvalidTooltip(props: InvalidTooltipProps) {
  return (
    <>
      {props.error && (
        <Overlay
          target={props.target}
          show={props.touched && props.error != null}
          placement="bottom"
        >
          {(ttProps) => <Tooltip {...ttProps}>{props.error}</Tooltip>}
        </Overlay>
      )}
    </>
  );
}
