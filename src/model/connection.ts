import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

dotenv.config();

import { Activity } from "./Activity";
import { Ascent } from "./Ascent";
import { AscentCreatorSubscriber } from "./AscentCreatorSubscriber";
import { List } from "./List";
import { Mountain } from "./Mountain";
import { User } from "./User";

const BASE_CONFIG: PostgresConnectionOptions = {
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

export async function connectToDb(options: PostgresConnectionOptions) {
  const db = new DataSource({ ...BASE_CONFIG, ...options });
  await db.initialize();
  return db;
}
