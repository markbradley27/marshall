import { GoogleMap as ReactGoogleMap, Polyline } from "@react-google-maps/api";
import { MountainState } from "api/mountain_endpoints";
import { geoJsonToCoords } from "api/util";
import { Feature, FeatureCollection, LineString, Position } from "geojson";
import toBBox from "geojson-bounding-box";
import useGoogleMaps from "hooks/loadGoogleMaps";
import { useCallback, useState } from "react";

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

  if (props.path != null) {
    featureCollection.features.push({
      type: "Feature",
      geometry: props.path,
    } as Feature);
  }
  if (props.primary != null) {
    featureCollection.features.push({
      type: "Feature",
      geometry: props.primary.location,
    } as Feature);
  }
  if (props.secondaries != null) {
    for (const secondary of props.secondaries) {
      featureCollection.features.push({
        type: "Feature",
        geometry: secondary.location,
      } as Feature);
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
  // Path that should be displayed on the map.
  path?: LineString;
  // Main mountain that should be highlighted on the map.
  primary?: MountainState;
  // Array of mountains that should also be displayed on the map but less
  // prominently.
  secondaries?: MountainState[];
}

export default function GoogleMap(props: GoogleMapProps) {
  const [, setNextZIndex] = useState(0);

  const googleMapsLoaded = useGoogleMaps();

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (
        props.primary != null &&
        props.secondaries == null &&
        props.path == null
      ) {
        map.setCenter({
          lng: props.primary.location.coordinates[0],
          lat: props.primary.location.coordinates[1],
        });
        map.setZoom(12);
      } else {
        map.fitBounds(getLatLngBounds(props));
      }
    },
    [props]
  );

  const getNextZIndex = useCallback(() => {
    let current = 0;
    setNextZIndex((zIndex) => {
      current = zIndex;
      return zIndex + 1;
    });
    return current;
  }, []);

  return googleMapsLoaded &&
    (props.primary || props.secondaries || props.path) ? (
    <ReactGoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      options={{
        streetViewControl: false,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
      }}
      onLoad={onLoad}
    >
      {props.path && (
        <Polyline
          options={{ strokeColor: "#fc5200" }}
          path={props.path.coordinates.map((point: Position) => ({
            lng: point[0],
            lat: point[1],
          }))}
        />
      )}
      {props.primary && (
        <MountainMarker
          coords={geoJsonToCoords(props.primary.location)}
          getNextZIndex={getNextZIndex}
          name={props.primary.name}
          id={props.primary.id}
        />
      )}
      {props.secondaries &&
        props.secondaries.map((secondary) => (
          <MountainMarker
            coords={geoJsonToCoords(secondary.location)}
            getNextZIndex={getNextZIndex}
            key={secondary.id}
            name={secondary.name}
            id={secondary.id}
          />
        ))}
    </ReactGoogleMap>
  ) : (
    <></>
  );
}
