import { useCallback, useState } from "react";
import { GoogleMap } from "@react-google-maps/api";

import { MountainState, MountainUiState } from "../api_shim";
import MountainMarker from "./MountainMarker";

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

interface MountainMapProps {
  mountain: MountainState;
  nearby?: MountainState[];
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
      {props.nearby?.map((nearby) => {
        return (
          <MountainMarker
            key={nearby.id}
            coords={nearby.coords}
            state={MountainUiState.SECONDARY}
          />
        );
      })}
    </GoogleMap>
  ) : (
    <></>
  );
}

export default MountainMap;
