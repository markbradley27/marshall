import dotenv from "dotenv";

import { createConnection } from "./model/connection";
import { Server } from "./server";

dotenv.config();

async function main() {
  const dbConn = await createConnection();
  const server = new Server(dbConn);
  server.listen();
}

main();
