import admin from "firebase-admin";
import express from "express";

import { Logger } from "tslog";

const logger: Logger = new Logger();

// Checks the request for the id-token header and ensures it belongs to a valid
// user. If so, appends the uid property to the request object.
function verifyIdToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const idToken = req.get("id-token");
  if (idToken == null) {
    logger.info("Request missing id-token header.");
    res.status(403);
    res.send("Forbidden!");
    return;
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      logger.info(`Authenticated as ${decodedToken.uid}.`);
      req.uid = decodedToken.uid;
      next();
    })
    .catch((error: Error) => {
      logger.info(`Error verifying ID token: ${error}`);
      res.status(403);
      res.send("Forbidden!");
      return;
    });
}

export { verifyIdToken };
