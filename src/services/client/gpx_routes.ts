import express from "express";
import togeojson from "togeojson";
import { Logger } from "tslog";
import { DataSource } from "typeorm";

import { verifyIdToken } from "../../middleware/auth";
import { Activity, ActivitySource } from "../../model/Activity";

const logger = new Logger();

export class GpxRoutes {
  router: express.Router;

  #db: DataSource;

  constructor(db: DataSource) {
    this.#db = db;

    this.router = express.Router();
    this.router.post("/gpx", verifyIdToken, this.postGpx.bind(this));
  }

  // Can be tested with curl like so:
  // curl --data "@/path/to/file.gpx" \
  //      -X POST localhost:3003/api/client/gpx?user="USERNAME" \
  //      -H "Content-Type: application/gpx"
  async postGpx(req: express.Request, res: express.Response) {
    const geoJson = togeojson.gpx(req.body);

    if (geoJson.features[0].geometry.type !== "LineString") {
      res.status(400).json({
        error: { code: 400, message: "Multi-track GPX files not supported" },
      });
      return;
    }
    if (geoJson.features[0].geometry.coordinates[0].length > 2) {
      logger.info("Trimming elevation data off of gpx upload.");
      for (const coords of geoJson.features[0].geometry.coordinates) {
        while (coords.length > 2) {
          coords.pop();
        }
      }
    }

    this.#db.getRepository(Activity).create({
      user: { id: req.uid },
      source: ActivitySource.gpx,
      name: geoJson.features[0].properties.name,
      date: geoJson.features[0].properties.time,
      path: geoJson.features[0].geometry,
    });

    res.sendStatus(200);
  }
}
