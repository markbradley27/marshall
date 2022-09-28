import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinTable,
  RelationId,
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

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Mountain, (mountain) => mountain.lists)
  @JoinTable()
  mountains: Mountain[];

  // TODO: Think about what should happen to lists when the owner is deleted.
  @ManyToOne(() => User, (user) => user.lists)
  owner: User;

  @RelationId((list: List) => list.owner)
  ownerId: string;
}
