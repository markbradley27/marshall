// TODO: Better error logging and handling.
// TODO: Query validation (pretty sure there's express middleware for this.

import { User } from "../model";
import { verifyIdToken } from "../middleware/auth";

import admin from "firebase-admin";
import express from "express";
import togeojson from "togeojson";

class ClientService {
  router: express.Router;

  constructor() {
    this.router = express.Router();
    this.router.post("/user", this.postUser.bind(this));
    this.router.post("/gpx", verifyIdToken, this.postGpx.bind(this));
  }

  // Registers a user with firebase and in the local db.
  async postUser(req: express.Request, res: express.Response) {
    const email = req.query.email as string;
    const password = req.query.password as string;
    const name = req.query.name as string;
    if (!email || !password || !name) {
      res.status(400);
      res.send("Must provide email, password, and name.");
      return;
    }

    let uid: string;
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });
      uid = userRecord.uid;
    } catch (error) {
      res.status(400);
      res.send(error);
    }

    // TODO: Clean up firebase user if this fails?
    try {
      await User.create({ id: uid, name });
    } catch (error) {
      res.status(400);
      res.send(error);
    }

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
      where: { id: req.uid },
    });

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
