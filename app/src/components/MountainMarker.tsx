import { Marker } from "@react-google-maps/api";

import { MountainUiState } from "../api_shim";

interface MountainMarkerProps {
  coords: google.maps.LatLng;
  label?: string;
  state?: MountainUiState;
  // Should be type Clusterer from react-google-maps, but that type isn't
  // exported.
  clusterer?: any;
}
export default function MountainMarker(props: MountainMarkerProps) {
  let scale = 3;
  let zIndex = 2;
  switch (props.state) {
    case MountainUiState.NEUTRAL:
      break;
    case MountainUiState.SECONDARY:
      scale /= 1.5;
      zIndex = 1;
      break;
    case MountainUiState.HIGHLIGHTED:
      scale *= 1.3;
      zIndex = 3;
      break;
  }

  const icon = {
    path: "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
    fillColor: "darkgreen",
    fillOpacity: 1.0,
    strokeWeight: 0,
    rotation: 0,
    scale: scale,
    anchor: new google.maps.Point(13, 22),
  };

  return (
    <Marker
      position={props.coords}
      icon={icon}
      label={props.label}
      zIndex={zIndex}
      clusterer={props.clusterer}
    />
  );
}
