import dotenv from "dotenv";
dotenv.config();

import { sequelize, Activity, Ascent, Mountain } from "../src/model";

import { Command } from "commander";

async function main() {
  const program = new Command();
  program
    .option("-d --drop")
    .option("-dabu --drop_all_but_users")
    .option("-s --sync")
    .parse(process.argv);
  const options = program.opts();

  if (options.drop) {
    await sequelize.drop({ cascade: true });
  }
  if (options.drop_all_but_users) {
    await Activity.drop({ cascade: true });
    await Ascent.drop({ cascade: true });
    await Mountain.drop({ cascade: true });
  }
  if (options.sync) {
    sequelize.query("CREATE EXTENSION IF NOT EXISTS postgis", { raw: true });
    await sequelize.sync();
  }
}

main();
