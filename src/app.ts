import dotenv from "dotenv";

import { connectToDb } from "./model/connection";
import { Server } from "./server";

dotenv.config();

async function main() {
  const db = await connectToDb();
  const server = new Server(db);
  server.listen();
}

main();
