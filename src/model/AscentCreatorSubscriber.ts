import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  Raw,
} from "typeorm";

import { Activity } from "./Activity";
import { Ascent } from "./Ascent";
import { Mountain } from "./Mountain";

@EventSubscriber()
export class AscentCreatorSubscriber
  implements EntitySubscriberInterface<Activity>
{
  listenTo() {
    return Activity;
  }

  async afterInsert(event: InsertEvent<Activity>) {
    const ascendedMountains = await event.manager.getRepository(Mountain).find({
      select: ["id"],
      where: {
        location: Raw(
          (location) =>
            `ST_DWithin(${location}, ST_GeomFromGeoJSON(:path), 50)`,
          { path: event.entity.path }
        ),
      },
    });
    await event.manager.getRepository(Ascent).insert(
      ascendedMountains.map((mountain) => {
        // TODO: This doesn't handle time correctly.
        return {
          date: event.entity.date.toUTCString(),
          dateOnly: false,
          timeZone: mountain.timeZone,
          activity: {
            id: event.entity.id,
          },
          mountain: {
            id: mountain.id,
          },
          user: {
            id: event.entity.user.id,
          },
        };
      })
    );
  }
}
