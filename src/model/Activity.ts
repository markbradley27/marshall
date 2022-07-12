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
  gpx = "gpx",
}

@Entity()
@Unique(["source", "sourceId"])
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: PrivacySetting,
    default: PrivacySetting.PRIVATE,
  })
  privacy: PrivacySetting;

  @Column({ type: "enum", enum: ActivitySource })
  source: ActivitySource;

  @Column({ nullable: true })
  sourceId: string;

  @Column({ nullable: true })
  sourceUserId: string;

  @Column()
  name: string;

  @Column()
  date: Date;

  @Column({
    type: "geography",
    spatialFeatureType: "LineString",
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
