import { Point } from "geojson";

export function geoJsonToCoords(geoJson: Point) {
  return new google.maps.LatLng({
    lat: geoJson.coordinates[1],
    lng: geoJson.coordinates[0],
  });
}
