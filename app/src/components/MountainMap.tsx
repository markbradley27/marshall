import { useCallback, useState } from "react";
import { GoogleMap } from "@react-google-maps/api";

import { MountainInfo } from "./mountain_types";
import MountainMarker from "./MountainMarker";

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

interface MountainMapProps {
  mountain: MountainInfo;
}
function MountainMap(props: MountainMapProps) {
  const [, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  return props.mountain ? (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      options={{ mapTypeId: google.maps.MapTypeId.TERRAIN }}
      center={props.mountain.coords}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      <MountainMarker coords={props.mountain.coords} />
    </GoogleMap>
  ) : (
    <></>
  );
}

export default MountainMap;
