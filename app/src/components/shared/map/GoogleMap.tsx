import {
  GoogleMap as ReactGoogleMap,
  MarkerClusterer,
} from "@react-google-maps/api";
import { MountainState } from "api/mountain_endpoints";
import { geoJsonToCoords } from "api/util";
import { Feature, FeatureCollection } from "geojson";
import toBBox from "geojson-bounding-box";
import useGoogleMaps from "hooks/loadGoogleMaps";
import { useCallback } from "react";

import MountainMarker from "./MountainMarker";

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

// Returns a bounding box of the form [minLon, minLat, maxLon, maxLat] that
// bounds all mountains provided in props (primary and secondaries).
function getLatLngBounds(props: GoogleMapProps) {
  const featureCollection = {
    type: "FeatureCollection",
    features: [],
  } as FeatureCollection;

  if (props.primary != null) {
    const primaryFeature = {
      type: "Feature",
      geometry: props.primary.location,
    } as Feature;
    featureCollection.features.push(primaryFeature);
  }
  if (props.secondaries != null) {
    for (const secondary of props.secondaries) {
      const secondaryFeature = {
        type: "Feature",
        geometry: secondary.location,
      } as Feature;
      featureCollection.features.push(secondaryFeature);
    }
  }
  const bbox = toBBox(featureCollection);
  // This happens when there's elevation information (a z dimension) present.
  if (bbox.length === 6) {
    return new google.maps.LatLngBounds(
      { lng: bbox[0], lat: bbox[1] },
      { lng: bbox[3], lat: bbox[4] }
    );
  }
  return new google.maps.LatLngBounds(
    { lng: bbox[0], lat: bbox[1] },
    { lng: bbox[2], lat: bbox[3] }
  );
}

interface GoogleMapProps {
  // Main mountain that should be highlighted on the map.
  primary?: MountainState;
  // Array of mountains that should also be displayed on the map but less
  // prominently.
  secondaries?: MountainState[];
}

export default function GoogleMap(props: GoogleMapProps) {
  const googleMapsLoaded = useGoogleMaps();

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      // TODO: Finish this.
      if (props.secondaries) {
        map.fitBounds(getLatLngBounds(props));
      } else if (props.primary != null) {
        map.setCenter({
          lng: props.primary.location.coordinates[0],
          lat: props.primary.location.coordinates[1],
        });
        map.setZoom(12);
      }
    },
    [props]
  );

  return googleMapsLoaded && (props.primary || props.secondaries) ? (
    <ReactGoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      options={{
        streetViewControl: false,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
      }}
      onLoad={onLoad}
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
