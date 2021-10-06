import { useCallback, useState } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "1400px",
  height: "800px",
};

// TODO: Figure out google maps types.
interface ActivityMapProps {
  path: any;
  mountains: any;
  bounds: any;
}
function ActivityMap(props: ActivityMapProps) {
  const [, setMap] = useState<any>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });

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

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      options={{ mapTypeId: "terrain" }}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      <Polyline path={props.path} />
      {props.mountains.map((mountain: any) => {
        return <Marker key={mountain.id} position={mountain.coords} />;
      })}
    </GoogleMap>
  ) : (
    <></>
  );
}

export default ActivityMap;
