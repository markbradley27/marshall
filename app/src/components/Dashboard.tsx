import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";

import { useAuth } from "../contexts/auth";
import AscentList from "./AscentList";
import { fetchAscents, AscentState } from "../api_shim";
import useGoogleMaps from "../hooks/loadGoogleMaps";

export default function Dashboard() {
  const [ascents, setAscents] = useState<AscentState[] | null>(null);

  const auth = useAuth();
  const googleMapsLoaded = useGoogleMaps();

  useEffect(() => {
    async function fetchData() {
      const idToken = (await auth.user?.getIdToken()) as string;
      const ascents = await fetchAscents({
        idToken,
        includeMountains: true,
      });
      setAscents(ascents);
    }

    if (ascents == null && googleMapsLoaded) {
      fetchData();
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
