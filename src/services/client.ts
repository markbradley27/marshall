import { sequelize, User } from "../model";

import express from "express";
import togeojson from "togeojson";

import { Logger } from "tslog";

class ClientService {
  router: express.Router;

  constructor() {
    this.router = express.Router();
    this.router.post("/gpx", this.postGpx.bind(this));
    this.router.post("/user", this.postUser.bind(this));
  }

  async postUser(req: express.Request, res: express.Response) {
    await User.create({ name: req.query.name as string });
    res.sendStatus(200);
  }

  // Can be tested with curl like so:
  // curl --data "@/path/to/file.gpx" \
  //      -X POST localhost:3003/api/client/gpx?user="USERNAME" \
  //      -H "Content-Type: application/gpx"
  async postGpx(req: express.Request, res: express.Response) {
    const geoJson = togeojson.gpx(req.body);

    if (geoJson.features[0].geometry.type !== "LineString") {
      res.status(400).send("Multi-track GPX files not supported");
      return;
    }

    const user = await User.findOne({
      where: { name: req.query.user },
    });
    if (user === null) {
      res.status(404).send("User not found");
    }

    await user.createActivity({
      source: "gpx_file",
      name: geoJson.features[0].properties.name,
      date: geoJson.features[0].properties.time,
      path: geoJson.features[0].geometry,
    });

    res.sendStatus(200);
  }
}

export default ClientService;
