import { InfoWindow, Marker } from "@react-google-maps/api";
import { useState } from "react";
import { useHistory } from "react-router-dom";

interface MountainMarkerProps {
  name: string;
  id: number;
  coords: google.maps.LatLng;
  label?: string;
  getNextZIndex: () => number;
}
export default function MountainMarker(props: MountainMarkerProps) {
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [zIndex, setZIndex] = useState(0);

  const history = useHistory();

  const image = {
    url: "/graphics/mountain_marker.svg",
    anchor: new google.maps.Point(24, 62),
  };

  return (
    <Marker
      icon={image}
      label={props.label}
      onClick={() => {
        history.push(`mountain/${props.id}`);
      }}
      onMouseOver={() => {
        setZIndex(props.getNextZIndex());
        setShowInfoWindow(true);
      }}
      onMouseOut={() => {
        setShowInfoWindow(false);
      }}
      position={props.coords}
      zIndex={zIndex}
    >
      {showInfoWindow && (
        <InfoWindow>
          <div>{props.name}</div>
        </InfoWindow>
      )}
    </Marker>
  );
}
