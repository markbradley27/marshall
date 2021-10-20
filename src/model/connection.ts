import dotenv from "dotenv";
import { Logger } from "tslog";
import {
  createConnection as typeormCreateConnection,
  ConnectionOptions,
} from "typeorm";

dotenv.config();
const logger: Logger = new Logger();

import { Activity } from "./Activity";
import { Ascent } from "./Ascent";
import { List } from "./List";
import { Mountain } from "./Mountain";
import { User } from "./User";

export const BASE_CONFIG: ConnectionOptions = {
  type: "postgres",
  entities: [Activity, Ascent, List, Mountain, User],
  logging: true,
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  username: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  schema: "typeorm",
};

export function createConnection(options?: ConnectionOptions) {
  return typeormCreateConnection({
    ...BASE_CONFIG,
    ...options,
  } as ConnectionOptions);
}
