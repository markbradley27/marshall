import { Marker } from "@react-google-maps/api";

interface MountainMarkerProps {
  coords: google.maps.LatLng;
  label?: string;
  //  state?: MountainUiState;
  // Should be type Clusterer from react-google-maps, but that type isn't
  // exported.
  clusterer?: any;
}
export default function MountainMarker(props: MountainMarkerProps) {
  let zIndex = 2;
  /*
  switch (props.state) {
    case MountainUiState.NEUTRAL:
      break;
    case MountainUiState.SECONDARY:
      zIndex = 1;
      break;
    case MountainUiState.HIGHLIGHTED:
      zIndex = 3;
      break;
  }
  */

  const image = {
    url: "/graphics/mountain_marker.svg",
    anchor: new google.maps.Point(24, 62),
  };

  return (
    <Marker
      position={props.coords}
      icon={image}
      label={props.label}
      zIndex={zIndex}
      clusterer={props.clusterer}
    />
  );
}
