import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  RelationId,
} from "typeorm";

import { Activity } from "./Activity";
import { Mountain } from "./Mountain";
import { User } from "./User";
import { PrivacySetting } from "./privacy_setting";

@Entity()
export class Ascent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: PrivacySetting,
    default: PrivacySetting.PRIVATE,
  })
  privacy: PrivacySetting;

  @Column("date")
  date: string;

  @Column({ type: "time", nullable: true })
  time: string;

  @Column()
  timeZone: string;

  @ManyToOne(() => Activity, (activity) => activity.ascents, {
    onDelete: "CASCADE",
  })
  activity: Activity;

  @RelationId((ascent: Ascent) => ascent.activity)
  activityId: number;

  @ManyToOne(() => Mountain, (mountain) => mountain.ascents, {
    onDelete: "CASCADE",
  })
  mountain: Mountain;

  @RelationId((ascent: Ascent) => ascent.mountain)
  mountainId: number;

  @ManyToOne(() => User, (user) => user.ascents, { onDelete: "CASCADE" })
  user: User;

  @RelationId((ascent: Ascent) => ascent.user)
  userId: string;
}
