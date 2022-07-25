import dotenv from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";

dotenv.config();

import { Activity } from "./Activity";
import { Ascent } from "./Ascent";
import { AscentCreatorSubscriber } from "./AscentCreatorSubscriber";
import { List } from "./List";
import { Mountain } from "./Mountain";
import { User } from "./User";

const BASE_CONFIG: DataSourceOptions = {
  type: "postgres",
  entities: [Activity, Ascent, List, Mountain, User],
  subscribers: [AscentCreatorSubscriber],
  logging: true,
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  username: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
};

export async function connectToDb() {
  const db = new DataSource(BASE_CONFIG);
  await db.initialize();
  return db;
}
