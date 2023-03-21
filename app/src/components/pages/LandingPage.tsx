import { Image } from "react-bootstrap";

export default function LandingPage() {
  return (
    <div className="text-center">
      <Image
        src={"/graphics/logo_full_fontless.svg"}
        width="500"
        className="mx-auto d-block py-4"
      />
      <h3>A summit tracker for the modern peakbagger.</h3>
    </div>
  );
}
