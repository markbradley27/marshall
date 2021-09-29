import express from "express";
import { validationResult } from "express-validator";

import { Logger } from "tslog";

const logger: Logger = new Logger();

export function checkValidation(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    validationResult(req).throw();
  } catch (error) {
    logger.error(error);
    res.status(400);
    next(error);
    return;
  }
  next();
}
