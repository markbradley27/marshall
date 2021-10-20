import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinTable,
} from "typeorm";

import { Mountain } from "./Mountain";
import { User } from "./User";

@Entity()
export class List {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  private: boolean;

  @ManyToMany(() => Mountain, (mountain) => mountain.lists)
  @JoinTable()
  mountains: Mountain[];

  @ManyToOne(() => User, (user) => user.lists)
  owner: User;
}
