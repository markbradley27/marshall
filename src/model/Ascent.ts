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

@Entity()
export class Ascent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  // Indicates the date only represents a day (time will be midnight UTC).
  @Column({ default: false })
  dateOnly: boolean;

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
  userId: number;
}
