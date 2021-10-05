// TODO: Some of these methods should ABSOLUTELY NOT be deployed to prod!

import { Activity, ActivitySource, Ascent, Mountain, User } from "../model";
import { verifyIdToken } from "../middleware/auth";
import { checkValidation } from "../middleware/validation";

import admin from "firebase-admin";
import express from "express";
import { query } from "express-validator";
import togeojson from "togeojson";

import { Logger } from "tslog";

const logger = new Logger();

class ClientService {
  router: express.Router;

  constructor() {
    this.router = express.Router();
    this.router.get(
      "/activity",
      query("activity_id").isNumeric(),
      query("include_ascents").default("false").isBoolean(),
      checkValidation,
      verifyIdToken,
      this.getActivity.bind(this)
    );
    this.router.post(
      "/user",
      query("email").isEmail(),
      query("password").isString(),
      query("name").isString(),
      checkValidation,
      this.postUser.bind(this)
    );
    this.router.delete(
      "/user",
      query("uid").isString(),
      checkValidation,
      this.deleteUser.bind(this)
    );
    this.router.post("/gpx", verifyIdToken, this.postGpx.bind(this));
  }

  async getActivity(req: express.Request, res: express.Response) {
    const activity = await Activity.findOne({
      where: { id: req.query.activity_id },
      include:
        req.query.include_ascents === "true"
          ? {
              model: Ascent,
              include: [{ model: Mountain }],
            }
          : undefined,
    });

    if (activity == null) {
      res.sendStatus(404);
    }
    if (activity.UserId !== req.uid) {
      res.sendStatus(403);
    }

    // TODO: Don't return all fields by default.
    res.json(activity.toJSON());
  }

  // Registers a user with firebase and in the local db.
  async postUser(req: express.Request, res: express.Response) {
    const email = req.query.email as string;
    const password = req.query.password as string;
    const name = req.query.name as string;

    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });
      const uid = userRecord.uid;

      // TODO: Clean up firebase user if this fails?
      await User.create({ id: uid, name });
    } catch (error) {
      res.status(400).send(error);
      return;
    }

    res.sendStatus(200);
  }

  // Deletes a user from both firebase and the local db.
  async deleteUser(req: express.Request, res: express.Response) {
    const uid = req.query.uid as string;

    try {
      const user = await User.findOne({
        where: { id: uid },
      });
      await admin.auth().deleteUser(uid);
      await user.destroy();
    } catch (error) {
      res.status(400).send(error);
      return;
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
    if (geoJson.features[0].geometry.coordinates[0].length > 2) {
      logger.info("Trimming elevation data off of gpx upload.");
      for (const coords of geoJson.features[0].geometry.coordinates) {
        while (coords.length > 2) {
          coords.pop();
        }
      }
    }

    const user = await User.findOne({
      where: { id: req.uid },
    });

    await user.createActivity({
      source: ActivitySource.gpx,
      name: geoJson.features[0].properties.name,
      date: geoJson.features[0].properties.time,
      path: geoJson.features[0].geometry,
    });

    res.sendStatus(200);
  }
}

export default ClientService;
