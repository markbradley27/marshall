import { fetchMountains, MountainState } from "api/mountain_endpoints";
import { useCallback, useEffect, useState } from "react";
import { Ratio } from "react-bootstrap";

import useGoogleMaps from "../hooks/loadGoogleMaps";

import GoogleMap from "./shared/map/GoogleMap";

export default function MountainBrowser() {
  const [mountains, setMountains] = useState<MountainState[] | null>(null);

  const googleMapsLoaded = useGoogleMaps();

  const refreshMountains = useCallback(async () => {
    const mountains = await fetchMountains();
    setMountains(mountains);
  }, []);

  useEffect(() => {
    if (googleMapsLoaded && mountains == null) {
      refreshMountains();
    }
  });

  return mountains ? (
    <Ratio aspectRatio="16x9">
      <GoogleMap secondaries={mountains} />
    </Ratio>
  ) : (
    <></>
  );
}
