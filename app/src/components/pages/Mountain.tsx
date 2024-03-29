import { fetchMountain, MountainState } from "api/mountain_endpoints";
import AscentList from "components/shared/ascent/AscentList";
import GoogleMap from "components/shared/map/GoogleMap";
import MountainList from "components/shared/mountain/MountainList";
import { useEffect, useState } from "react";
import { Stack } from "react-bootstrap";
import Ratio from "react-bootstrap/Ratio";
import { RouteComponentProps, withRouter } from "react-router-dom";

type MountainProps = RouteComponentProps<{
  mountainId: string;
}>;
function Mountain(props: MountainProps) {
  const [mountain, setMountain] = useState<MountainState | null>(null);

  useEffect(() => {
    async function fetchData() {
      setMountain(
        await fetchMountain(Number(props.match.params.mountainId), {
          includeAscents: true,
          includeNearbyWithin: 10000,
        })
      );
    }
    fetchData();
  }, [props.match.params.mountainId]);

  return mountain ? (
    <Stack gap={3}>
      <Ratio aspectRatio="21x9">
        <GoogleMap primary={mountain} />
      </Ratio>
      <h2>
        <a href={mountain.wikipediaLink}>{mountain.name}</a>
      </h2>
      {mountain.abstract && <p>{mountain.abstract}</p>}
      {mountain.ascents && (
        <>
          <h3>Recent ascents:</h3>
          <AscentList
            ascents={mountain.ascents}
            count={mountain.ascents.length}
            fetchMoreAscents={() => {}}
            pageLength={8}
            emptyPlaceholder={"No recorded ascents."}
          />
        </>
      )}
      {mountain.nearby && (
        <>
          <h3>Nearby peaks:</h3>
          <MountainList
            mountains={mountain.nearby}
            namesAreLinks={true}
            pageLength={8}
          />
        </>
      )}
    </Stack>
  ) : (
    <></>
  );
}

export default withRouter(Mountain);
