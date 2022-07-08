import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";

import { Activity } from "./Activity";
import { Ascent } from "./Ascent";
import { List } from "./List";
import { PrivacySetting } from "./privacy_setting";

export enum Gender {
  UNSPECIFIED = "unspecified",
  MALE = "male",
  FEMALE = "female",
  NON_BINARY = "non_binary",
}

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: "enum", enum: Gender, default: Gender.UNSPECIFIED })
  gender: Gender;

  @Column({ nullable: true })
  bio: string;

  @Column({
    type: "enum",
    enum: PrivacySetting,
    default: PrivacySetting.PUBLIC,
  })
  defaultActivityPrivacy: PrivacySetting;

  @Column({
    type: "enum",
    enum: PrivacySetting,
    default: PrivacySetting.PUBLIC,
  })
  defaultAscentPrivacy: PrivacySetting;

  @Column({ nullable: true })
  stravaAccessToken: string;

  @Column({ nullable: true })
  stravaRefreshToken: string;

  @Column({ nullable: true })
  stravaAccessTokenExpiresAt: Date;

  @Column({ nullable: true })
  stravaAthleteId: number;

  @OneToMany(() => Activity, (activity) => activity.user)
  activities: Activity[];

  @OneToMany(() => Ascent, (ascent) => ascent.user)
  ascents: Ascent[];

  @OneToMany(() => List, (list) => list.owner)
  lists: List[];
}
