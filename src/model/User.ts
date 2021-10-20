import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";

import { Activity } from "./Activity";
import { Ascent } from "./Ascent";
import { List } from "./List";

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  stravaAccessToken: string;

  @Column({ nullable: true })
  stravaRefreshToken: string;

  @Column({ nullable: true })
  stravaAccessTokenExpiresAt: Date;

  @Column({ nullable: true })
  stravaAthleteId: number;

  @OneToMany(() => Activity, (activity) => activity.user, {
    onDelete: "CASCADE",
  })
  activities: Activity[];

  @OneToMany(() => Ascent, (ascent) => ascent.user, { onDelete: "CASCADE" })
  ascents: Ascent[];

  @OneToMany(() => List, (list) => list.owner)
  lists: List[];
}
