import { GoogleMap, Polyline } from "@react-google-maps/api";
import { AscentState } from "api/ascent_endpoints";
import { useCallback, useState } from "react";

import MountainMarker from "./shared/map/MountainMarker";

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

interface ActivityMapProps {
  path: google.maps.LatLng[];
  ascents: AscentState[];
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
      options={{
        streetViewControl: false,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
      }}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      <Polyline path={props.path} options={{ strokeColor: "#34758a" }} />
      {props.ascents.map((ascent: any) => {
        return (
          <MountainMarker
            key={ascent.id}
            coords={ascent.mountain.coords}
            label={ascent.n.toString()}
          />
        );
      })}
    </GoogleMap>
  ) : (
    <></>
  );
}

export { ActivityMap };
