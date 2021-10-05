import { useAuth } from "../contexts/auth";

import toBBox from "geojson-bounding-box";
import { useCallback, useState } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
import { RouteComponentProps, withRouter } from "react-router-dom";

const mapContainerStyle = {
  width: "1400px",
  height: "800px",
};

type ActivityProps = RouteComponentProps<{
  activityId: string;
}>;
function Activity(props: ActivityProps) {
  // TODO: Figure out google maps types.
  const [name, setName] = useState("");
  const [path, setPath] = useState<any>(null);
  const [mountains, setMountains] = useState<any>(null);
  const [, setMap] = useState<any>(null);

  const auth = useAuth();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });

  const onLoad = useCallback(
    function callback(map) {
      async function fetchActivity() {
        const idToken = (await auth.user?.getIdToken()) as string;
        const activityResp: any = await fetch(
          "/api/client/activity?include_ascents=true&activity_id=" +
            props.match.params.activityId,
          {
            headers: {
              "id-token": idToken,
            },
          }
        );
        const activity = await activityResp.json();

        const path = activity.path.coordinates.map((coords: any) => {
          return { lat: coords[1], lng: coords[0] };
        });

        const mountains = activity.Ascents.map((ascent: any) => {
          const coords = ascent.Mountain.location.coordinates;
          return {
            id: ascent.Mountain.id,
            coords: { lat: coords[1], lng: coords[0] },
          };
        });

        const boundingBox = toBBox(activity.path);
        const bounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(boundingBox[1], boundingBox[0]),
          new window.google.maps.LatLng(boundingBox[3], boundingBox[2])
        );
        map.fitBounds(bounds);

        setName(activity.name);
        setPath(path);
        setMountains(mountains);
        setMap(map);
      }

      if (path == null) {
        fetchActivity();
      }
    },
    [auth.user, path, props.match.params.activityId]
  );

  const onUnmount = useCallback(function callback(map) {
    console.log(map);
    setMap(null);
  }, []);

  return isLoaded && auth.user != null ? (
    <div>
      <h2>{name}</h2>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        options={{ mapTypeId: "terrain" }}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {path && <Polyline path={path} />}
        {mountains &&
          mountains.map((mountain: any) => {
            return <Marker key={mountain.id} position={mountain.coords} />;
          })}
      </GoogleMap>
    </div>
  ) : (
    <></>
  );
}

export default withRouter(Activity);
