import { Command } from "commander";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

import { Logger } from "tslog";

const logger: Logger = new Logger();

const program = new Command();
program
  .option("-e --email <email>", "user email")
  .option("-p --password <password>", "user password")
  .parse(process.argv);
const options = program.opts();

const firebaseConfig = {
  apiKey: "AIzaSyCmQSNBUY-ErdWnJmZ8e-EiGgYSrtD5Uj0",
  authDomain: "marshall-d574a.firebaseapp.com",
  projectId: "marshall-d574a",
  storageBucket: "marshall-d574a.appspot.com",
  messagingSenderId: "441621754616",
  appId: "1:441621754616:web:a5286491e0bbec689f810d",
  measurementId: "G-7NMJSQVN06",
};
const app = initializeApp(firebaseConfig);

const auth = getAuth();
signInWithEmailAndPassword(auth, options.email, options.password)
  .then((userCredential) => {
    logger.info("User credential:", userCredential);
    auth.currentUser
      .getIdToken()
      .then((idToken) => {
        logger.info("ID token:", idToken);
      })
      .catch((error) => {
        logger.info("Error:", error);
      });
  })
  .catch((error) => {
    logger.info("Error:", error);
  });
