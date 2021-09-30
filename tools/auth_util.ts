import { Command } from "commander";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

import * as fs from "fs/promises";

import { Logger } from "tslog";

const logger: Logger = new Logger();

function initApp() {
  const firebaseConfig = {
    apiKey: "AIzaSyCmQSNBUY-ErdWnJmZ8e-EiGgYSrtD5Uj0",
    authDomain: "marshall-d574a.firebaseapp.com",
    projectId: "marshall-d574a",
    storageBucket: "marshall-d574a.appspot.com",
    messagingSenderId: "441621754616",
    appId: "1:441621754616:web:a5286491e0bbec689f810d",
    measurementId: "G-7NMJSQVN06",
  };
  initializeApp(firebaseConfig);
}

async function getToken(email: string, password: string) {
  const auth = getAuth();
  await signInWithEmailAndPassword(auth, email, password);
  return await auth.currentUser.getIdToken();
}

async function logToken(email: string, password: string) {
  logger.info("Token:", await getToken(email, password));
}

async function saveToken(email: string, password: string) {
  const token = await getToken(email, password);
  const file = await fs.open(email + ".id_token", "w");
  await file.write("id-token: " + token);
  await file.close();
}

async function main() {
  const program = new Command();
  program
    .option("-lt --log_token")
    .option("-st --save_token")
    .option("-e --email <email>", "user email")
    .option("-p --password <password>", "user password")
    .parse(process.argv);
  const options = program.opts();

  initApp();

  if (options.log_token) {
    return await logToken(options.email, options.password);
  }
  if (options.save_token) {
    return await saveToken(options.email, options.password);
  }
}

main();
