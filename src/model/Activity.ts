import { LineString } from "geojson";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  Unique,
  RelationId,
} from "typeorm";

import { Ascent } from "./Ascent";
import { User } from "./User";
import { PrivacySetting } from "./privacy_setting";

export enum ActivitySource {
  strava = "strava",
  // TODO: Remove this.
  gpx = "gpx",
}

@Entity()
@Unique(["source", "sourceId"])
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    default: PrivacySetting.PRIVATE,
    enum: PrivacySetting,
    type: "enum",
  })
  privacy: PrivacySetting;

  @Column({ type: "enum", enum: ActivitySource })
  source: ActivitySource;

  @Column({ nullable: true })
  sourceId: string;

  // Used for de-auth of 3rd party services. If a user:
  // * Auths with a 3rd party account
  // * De-auths but keeps synced activities
  // * Auths with a different 3rd party account from the same services
  // * De-auths and chooses to delete synced activities
  // this makes sure the activities synced from the first account don't also get
  // deleted.
  @Column({ nullable: true })
  sourceUserId: string;

  @Column()
  name: string;

  @Column()
  date: Date;

  @Column()
  timeZone: string;

  @Column({
    nullable: true,
    spatialFeatureType: "LineString",
    type: "geography",
  })
  path: LineString;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Ascent, (ascent) => ascent.activity)
  ascents: Ascent[];

  @ManyToOne(() => User, (user) => user.activities, { onDelete: "CASCADE" })
  user: User;

  @RelationId((activity: Activity) => activity.user)
  userId: string;
}
