import express from "express";
import admin from "firebase-admin";
import { Logger } from "tslog";

const logger: Logger = new Logger();

// Checks the request for the id-token header and ensures it belongs to a valid
// user. If so, appends the uid property to the request object.
async function verifyIdTokenInternal(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
  tokenOptional: boolean
) {
  const idToken = req.get("id-token");
  if (idToken == null) {
    if (tokenOptional) {
      next();
      return;
    } else {
      logger.info("Request missing id-token header.");
      res.sendStatus(403);
      return;
    }
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    logger.info(`Authenticated as ${decodedToken.uid}.`);
    req.uid = decodedToken.uid;
  } catch (error) {
    logger.info(`Error verifying ID token: ${error}`);
  }

  if (!req.uid && !tokenOptional) {
    res.sendStatus(403);
    return;
  }

  next();
}

export async function verifyIdToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return verifyIdTokenInternal(req, res, next, /*tokenOptional=*/ false);
}

export async function maybeVerifyIdToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return verifyIdTokenInternal(req, res, next, /*tokenOptional=*/ true);
}
