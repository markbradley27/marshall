import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";

import { useAuth } from "../contexts/auth";
import AscentList from "./AscentList";
import { apiFetchAscents, AscentState } from "../api_shim";
import useGoogleMaps from "../hooks/loadGoogleMaps";

export default function Dashboard() {
  const [ascents, setAscents] = useState<AscentState[] | null>(null);

  const auth = useAuth();
  const googleMapsLoaded = useGoogleMaps();

  useEffect(() => {
    async function fetchAscents() {
      const idToken = (await auth.user?.getIdToken()) as string;
      const ascents = await apiFetchAscents({
        idToken,
        includeMountains: true,
      });
      setAscents(ascents);
    }

    if (ascents == null && googleMapsLoaded) {
      fetchAscents();
    }
  });

  return (
    ascents && (
      <Container>
        <h3> Welcome {auth.user?.displayName}</h3>
        <AscentList title="Your ascents:" ascents={ascents} />
      </Container>
    )
  );
}
