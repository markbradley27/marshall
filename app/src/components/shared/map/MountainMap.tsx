import {
  GoogleMap as ReactGoogleMap,
  MarkerClusterer,
} from "@react-google-maps/api";
import { MountainState } from "api/mountain_endpoints";
import { geoJsonToCoords } from "api/util";
import useGoogleMaps from "hooks/loadGoogleMaps";
import { useCallback, useState } from "react";

import MountainMarker from "./MountainMarker";

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

interface GoogleMapProps {
  // Main mountain that should be highlighted on the map.
  primary?: MountainState;
  // Array of mountains that should also be displayed on the map but less
  // prominently.
  secondaries?: MountainState[];

  initialBounds?: google.maps.LatLngBounds;
  zoom?: number;
}
export default function GoogleMap(props: GoogleMapProps) {
  const googleMapsLoaded = useGoogleMaps();

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

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  return googleMapsLoaded && (props.primary || props.secondaries) ? (
    <ReactGoogleMap
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
    </ReactGoogleMap>
  ) : (
    <></>
  );
}
