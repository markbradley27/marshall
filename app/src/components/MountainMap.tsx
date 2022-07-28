import { GoogleMap, MarkerClusterer } from "@react-google-maps/api";
import { MountainState } from "api/mountain_endpoints";
import { geoJsonToCoords } from "api/util";
import { useCallback, useState } from "react";

import MountainMarker from "./MountainMarker";

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

interface MountainMapProps {
  primary?: MountainState;
  secondaries?: MountainState[];

  initialBounds?: google.maps.LatLngBounds;
  zoom?: number;
}
export default function MountainMap(props: MountainMapProps) {
  const [, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(
    (map) => {
      if (props.initialBounds != null) {
        map.fitBounds(props.initialBounds);
      }
      setMap(map);
    },
    [props.initialBounds]
  );

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  return props.primary || props.secondaries ? (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      options={{
        streetViewControl: false,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
      }}
      center={
        props.primary != null
          ? geoJsonToCoords(props.primary.location)
          : { lat: 0, lng: 0 }
      }
      zoom={props.zoom != null ? props.zoom : 12}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {props.primary && (
        <MountainMarker coords={geoJsonToCoords(props.primary.location)} />
      )}
      {props.secondaries && (
        <MarkerClusterer>
          {(clusterer) => {
            return props.secondaries?.map((secondary) => {
              return (
                <MountainMarker
                  key={secondary.id}
                  coords={geoJsonToCoords(secondary.location)}
                  //state={MountainUiState.SECONDARY}
                  clusterer={clusterer}
                />
              );
            });
          }}
        </MarkerClusterer>
      )}
    </GoogleMap>
  ) : (
    <></>
  );
}
