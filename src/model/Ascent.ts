import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";

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

  @ManyToOne(() => Mountain, (mountain) => mountain.ascents, {
    onDelete: "CASCADE",
  })
  mountain: Mountain;

  @ManyToOne(() => User, (user) => user.ascents, { onDelete: "CASCADE" })
  user: User;
}
