import { Command } from "commander";
import dotenv from "dotenv";

import { connectToDb } from "../src/model/connection";

dotenv.config();

interface OptionalConnectOpts {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
}

async function main() {
  const program = new Command();
  program
    //    .option("-d --drop")
    //    .option("-dabu --drop_all_but_users")
    .option("-s --sync")
    .option("-h --hostname <hostname>")
    .option("-p --port <port>")
    .option("-U --username <username>")
    .option("-W --password <password>")
    .option("-d --dbname <dbname>")

    .parse(process.argv);
  const options = program.opts();

  const optionalConnectOpts: OptionalConnectOpts = {};
  if (options.hostname) {
    optionalConnectOpts.host = options.hostname;
  }
  if (options.port) {
    optionalConnectOpts.port = options.port;
  }
  if (options.username) {
    optionalConnectOpts.username = options.username;
  }
  if (options.password) {
    optionalConnectOpts.password = options.password;
  }
  if (options.dbname) {
    optionalConnectOpts.database = options.dbname;
  }

  if (options.sync) {
    const connectOpts = {
      synchronize: true,
      installExtensions: true,
      ...optionalConnectOpts,
    };
    await connectToDb(connectOpts);
  }
}

main();
