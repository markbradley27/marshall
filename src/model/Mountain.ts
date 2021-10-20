import { Point } from "geojson";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  Unique,
} from "typeorm";

import { Ascent } from "./Ascent";
import { List } from "./List";

export enum MountainSource {
  dbpedia = "dbpedia",
}

@Entity()
@Unique(["source", "sourceId"])
export class Mountain {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "enum", enum: MountainSource })
  source: MountainSource;

  @Column({ nullable: true })
  sourceId: string;

  @Column()
  name: string;

  @Column({
    type: "geography",
    spatialFeatureType: "POINTZ",
  })
  location: Point;

  @Column({ nullable: true })
  wikipediaLink: string;

  @Column({ nullable: true })
  abstract: string;

  @OneToMany(() => Ascent, (ascent) => ascent.mountain, { onDelete: "CASCADE" })
  ascents: Ascent[];

  @ManyToMany(() => List, (list) => list.mountains)
  lists: List[];
}
