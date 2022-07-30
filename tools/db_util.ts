import { Command } from "commander";
import dotenv from "dotenv";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

import { connectToDb } from "../src/model/connection";

dotenv.config();

async function main() {
  const program = new Command();
  program
    //    .option("-d --drop")
    //    .option("-dabu --drop_all_but_users")
    .option("-s --sync")
    .parse(process.argv);
  const options = program.opts();

  if (options.sync) {
    await connectToDb({
      synchronize: true,
      installExtensions: true,
    } as PostgresConnectionOptions);
  }
}

main();
