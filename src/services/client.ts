// TODO: Some of these methods should ABSOLUTELY NOT be deployed to prod!

import express from "express";
import { oneOf, param, query } from "express-validator";
import admin from "firebase-admin";
import Sequelize from "sequelize";
import togeojson from "togeojson";
import { Logger } from "tslog";

import { maybeVerifyIdToken, verifyIdToken } from "../middleware/auth";
import { checkValidation } from "../middleware/validation";
import {
  Activity,
  ActivitySource,
  Ascent,
  Mountain,
  sequelize,
  User,
} from "../model";

const logger = new Logger();

const PAGE_SIZE = 20;

function activityModelToApi(activity: Activity): any {
  return {
    id: activity.id,
    source: activity.source,
    sourceId: activity.sourceId,
    name: activity.name,
    date: activity.date,
    path: activity.path,
    description: activity.description,

    ascents: activity.Ascents?.map(ascentModelToApi),
    userId: activity.UserId,
  };
}

function ascentModelToApi(ascent: Ascent): any {
  return {
    id: ascent.id,
    date: ascent.date,
    activityId: ascent.ActivityId,
    activity:
      ascent.Activity != null ? activityModelToApi(ascent.Activity) : undefined,
    mountainId: ascent.MountainId,
    mountain:
      ascent.Mountain != null ? mountainModelToApi(ascent.Mountain) : undefined,
    userId: ascent.UserId,
  };
}

interface MountainPlus extends Mountain {
  distance?: number;
}
function mountainModelToApi(mountain: MountainPlus): any {
  return {
    id: mountain.id,
    source: mountain.source,
    sourceId: mountain.sourceId,
    name: mountain.name,
    location: mountain.location,
    wikipediaLink: mountain.wikipediaLink,
    abstract: mountain.abstract,
    ascents:
      mountain.Ascents != null
        ? mountain.Ascents.map(ascentModelToApi)
        : undefined,
    distance: mountain.distance,
  };
}

function userModelToApi(user: User): any {
  return {
    id: user.id,
    name: user.name,
    activityCount: user.getDataValue("activityCount"),
    ascentCount: user.getDataValue("ascentCount"),
  };
}

class ClientService {
  router: express.Router;

  constructor() {
    this.router = express.Router();
    this.router.get(
      "/activities/:activityId?",
      param("activityId").optional().isNumeric(),
      query("include_ascents").default("false").isBoolean(),
      query("only_with_ascents").default(false).isBoolean(),
      query("page").default(0).isNumeric(),
      checkValidation,
      verifyIdToken,
      this.getActivities.bind(this)
    );
    this.router.get(
      "/ascents/:mountainId?",
      param("mountainId").optional().isNumeric(),
      query("include_mountains").optional().isBoolean(),
      query("page").default(0).isNumeric(),
      checkValidation,
      verifyIdToken,
      this.getAscents.bind(this)
    );
    this.router.get(
      "/mountains/:mountainId",
      param("mountainId").isNumeric(),
      oneOf([
        query("include_nearby").optional().isBoolean(),
        query("include_nearby").optional().isNumeric(),
      ]),
      query("include_ascents").optional().isBoolean(),
      checkValidation,
      maybeVerifyIdToken,
      this.getMountains.bind(this)
    );
    this.router.get(
      "/user/:userId",
      param("userId").isString(),
      checkValidation,
      verifyIdToken,
      this.getUser.bind(this)
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

  async getActivities(req: express.Request, res: express.Response) {
    const findOptions: any = {
      where: { UserId: req.uid },
      order: [["date", "DESC"]],
      limit: PAGE_SIZE,
      offset: PAGE_SIZE * parseInt(req.query.page as string, 10),
    };
    if (req.params.activityId != null) {
      findOptions.where.id = parseInt(req.params.activityId, 10);
    }
    if (req.query.only_with_ascents) {
      if (findOptions.include == null) {
        findOptions.include = {};
      }
      findOptions.include.model = Ascent;
      findOptions.include.required = true;
    }
    if (req.query.include_ascents === "true") {
      if (findOptions.include == null) {
        findOptions.include = {};
      }
      findOptions.include.model = Ascent;
      findOptions.include.include = [{ model: Mountain }];
    }

    const activities = await Activity.findAll(findOptions);

    if (!activities) {
      res.sendStatus(404);
      return;
    }

    if (activities.length === 1) {
      res.json(activityModelToApi(activities[0]));
      return;
    }
    res.json(activities.map(activityModelToApi));
  }

  async getAscents(req: express.Request, res: express.Response) {
    const whereClause: any = { UserId: req.uid };
    if (req.params.mountainId != null) {
      whereClause.mountainId = parseInt(req.params.mountainId, 10);
    }
    const ascents = await Ascent.findAll({
      where: whereClause,
      include:
        req.query.include_mountains === "true"
          ? { model: Mountain }
          : undefined,
      order: [["date", "DESC"]],
      limit: PAGE_SIZE,
      offset: PAGE_SIZE * parseInt(req.query.page as string, 10),
    });
    res.json(ascents.map(ascentModelToApi));
  }

  async getMountains(req: express.Request, res: express.Response) {
    if (req.query.include_ascents === "true" && req.uid === undefined) {
      res.sendStatus(403);
      return;
    }

    const includeNearby = req.query.include_nearby;
    let includeRadius = 0;
    if (includeNearby === "true") {
      includeRadius = 100000;
    } else if (includeNearby !== "false") {
      includeRadius = parseInt(includeNearby as string, 10);
    }

    let resJson: any;

    if (!includeRadius) {
      const mountain = await Mountain.findOne({
        where: { id: req.params.mountainId },
      });
      resJson = mountainModelToApi(mountain);
    } else {
      const nearby: any = await sequelize.query(
        `
        select
          other.*,
          ST_Distance(main.location, other.location) as distance
        from "Mountains" as main cross join "Mountains" as other
        where
          main.id=$mountainId and
          ST_DWithin(main.location, other.location, $includeRadius)
        order by distance;`,
        {
          bind: {
            mountainId: req.params.mountainId,
            includeRadius,
          },
        }
      );

      const main = nearby[0][0];
      delete main.distance;
      resJson = mountainModelToApi(main);
      resJson.nearby = nearby[0].slice(1).map(mountainModelToApi);
    }

    if (req.query.include_ascents === "true") {
      const ascents = await Ascent.findAll({
        where: { UserId: req.uid, MountainId: req.params.mountainId },
      });
      resJson.ascents = ascents.map(ascentModelToApi);
    }

    res.json(resJson);
  }

  async getUser(req: express.Request, res: express.Response) {
    const user = await User.findOne({
      where: { id: req.uid },
      attributes: {
        include: [
          [
            Sequelize.fn(
              "COUNT",
              Sequelize.fn("DISTINCT", Sequelize.col("Activities.id"))
            ),
            "activityCount",
          ],
          [
            Sequelize.fn(
              "COUNT",
              Sequelize.fn("DISTINCT", Sequelize.col("Ascents.id"))
            ),
            "ascentCount",
          ],
        ],
      },
      include: [
        { model: Activity, attributes: [] },
        { model: Ascent, attributes: [] },
      ],
      group: ["User.id"],
    });
    res.json(userModelToApi(user));
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
