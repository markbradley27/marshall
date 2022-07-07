import express from "express";
import { Logger } from "tslog";

const logger: Logger = new Logger();

export function logApiRequest(
  req: express.Request,
  _: express.Response,
  next: express.NextFunction
) {
  logger.info(
    `API Request: ${req.method} ${req.originalUrl} ${JSON.stringify(req.body)}`
  );
  next();
}
