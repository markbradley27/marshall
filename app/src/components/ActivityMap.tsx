import { useCallback, useState } from "react";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";

import { AscentInfo } from "./activity_types";

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

interface ActivityMapProps {
  path: google.maps.LatLng[];
  ascents: AscentInfo[];
  bounds: google.maps.LatLngBounds;
}
function ActivityMap(props: ActivityMapProps) {
  const [, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(
    (map) => {
      map.fitBounds(props.bounds);
      setMap(map);
    },
    [props.bounds]
  );

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  return props.path ? (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      options={{ mapTypeId: google.maps.MapTypeId.TERRAIN }}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      <Polyline path={props.path} />
      {props.ascents.map((ascent: any) => {
        return <Marker key={ascent.id} position={ascent.mountainCoords} />;
      })}
    </GoogleMap>
  ) : (
    <></>
  );
}

export { ActivityMap };
