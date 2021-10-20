import { Command } from "commander";
import dotenv from "dotenv";
import { ConnectionOptions } from "typeorm";

import { createConnection } from "../src/model/connection";

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
    await createConnection({
      synchronize: true,
      installExtensions: true,
    } as ConnectionOptions);
  }
}

main();
