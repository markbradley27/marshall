import { useCallback, useEffect, useState } from "react";
import { Ratio } from "react-bootstrap";

import { fetchMountains, MountainState } from "../api_shim";
import useGoogleMaps from "../hooks/loadGoogleMaps";

import MountainMap from "./MountainMap";

export default function MountainBrowser() {
  const [mountains, setMountains] = useState<MountainState[] | null>(null);

  const googleMapsLoaded = useGoogleMaps();

  const refreshMountains = useCallback(async () => {
    const mountains = await fetchMountains({});
    setMountains(mountains);
  }, []);

  useEffect(() => {
    if (googleMapsLoaded && mountains == null) {
      refreshMountains();
    }
  });

  return mountains ? (
    <Ratio aspectRatio="16x9">
      <MountainMap secondaries={mountains} zoom={2} />
    </Ratio>
  ) : (
    <></>
  );
}
