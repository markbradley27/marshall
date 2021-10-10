import { useJsApiLoader } from "@react-google-maps/api";

export default function useGoogleMaps(): boolean {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });
  return isLoaded;
}
