import express from "express";

import { DOMParser } from "xmldom";
import { Logger } from "tslog";

export default function (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.headers["content-type"] !== "application/gpx") {
    next();
    return;
  }

  const rawParser = express.text({ type: "application/gpx", limit: "50mb" });
  rawParser(req, res, () => {
    req.body = new DOMParser().parseFromString(req.body, "text/xml");
    next();
  });
}
