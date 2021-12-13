// TODO: Some of these methods should ABSOLUTELY NOT be deployed to prod!

import express from "express";
import { oneOf, param, query } from "express-validator";
import admin from "firebase-admin";
import { auth } from "firebase-admin";
import togeojson from "togeojson";
import { Logger } from "tslog";
import { Connection, FindConditions, Raw } from "typeorm";

import { maybeVerifyIdToken, verifyIdToken } from "../middleware/auth";
import { logApiRequest } from "../middleware/debug";
import { checkValidation } from "../middleware/validation";
import { Activity, ActivitySource } from "../model/Activity";
import { Ascent } from "../model/Ascent";
import { List } from "../model/List";
import { Mountain } from "../model/Mountain";
import { User } from "../model/User";

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

    ascents: activity.ascents?.map(ascentModelToApi),
    user: activity.user != null ? userModelToApi(activity.user) : undefined,
  };
}

function listModelToApi(list: List): any {
  return {
    id: list.id,
    name: list.name,
    owner: list.owner != null ? userModelToApi(list.owner) : undefined,
    private: list.private,
    mountains: list.mountains?.map(mountainModelToApi),
  };
}

function ascentModelToApi(ascent: Ascent): any {
  return {
    id: ascent.id,
    date: ascent.date,
    activity:
      ascent.activity != null ? activityModelToApi(ascent.activity) : undefined,
    mountain:
      ascent.mountain != null ? mountainModelToApi(ascent.mountain) : undefined,
    user: ascent.user != null ? userModelToApi(ascent.user) : undefined,
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
    ascents: mountain.ascents?.map(ascentModelToApi),
    distance: mountain.distance,
  };
}

interface UserPlus extends User {
  activityCount?: number;
  ascentCount?: number;
}
function userModelToApi(user: UserPlus): any {
  return {
    id: user.id,
    name: user.name,
    stravaAthleteId:
      user.stravaAthleteId != null ? user.stravaAthleteId : undefined,
    activityCount: user.activityCount,
    ascentCount: user.ascentCount,
  };
}

interface NewList {
  name: string;
  private: boolean;
  mountains: number[];
}

class ClientService {
  router: express.Router;

  #dbConn: Connection;

  constructor(dbConn: Connection) {
    this.#dbConn = dbConn;

    this.router = express.Router();
    this.router.use(logApiRequest);
    this.router.get(
      "/activities/:activityId?",
      param("activityId").optional().isNumeric(),
      query("include_ascents").default(false).isBoolean(),
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
    this.router.post(
      "/ascent",
      query("mountain_id").isNumeric(),
      // TODO: isISODate
      query("date").isString(),
      query("date_only").isBoolean(),
      checkValidation,
      verifyIdToken,
      this.postAscent.bind(this)
    );
    this.router.get(
      "/list/:listId",
      param("listId").isNumeric(),
      checkValidation,
      maybeVerifyIdToken,
      this.getList.bind(this)
    );
    // TODO: Validate json body too.
    this.router.post(
      "/list/:listId?",
      param("listId").optional().isNumeric(),
      checkValidation,
      verifyIdToken,
      this.postList.bind(this)
    );
    this.router.get(
      "/mountain/:mountainId",
      param("mountainId").isNumeric(),
      oneOf([
        query("include_nearby").optional().isBoolean(),
        query("include_nearby").optional().isNumeric(),
      ]),
      query("include_ascents").optional().isBoolean(),
      checkValidation,
      maybeVerifyIdToken,
      this.getMountain.bind(this)
    );
    this.router.get(
      "/mountains",
      // TODO: Write a custom validator for this.
      query("bounding_box").optional().isString(),
      checkValidation,
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
      query("name").isString(),
      query("id").isString(),
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
    const activityRepo = this.#dbConn.getRepository(Activity);
    const qb = activityRepo
      .createQueryBuilder("activity")
      .where("activity.userId = :userId", { userId: req.uid })
      .orderBy("activity.date", "DESC")
      .limit(PAGE_SIZE);
    if (req.params.activityId != null) {
      qb.andWhere("activity.id = :id", { id: req.params.activityId });
    }
    if (req.query.include_ascents === "true") {
      qb.leftJoinAndSelect("activity.ascents", "ascent");
    }
    if (req.query.only_with_ascents === "true") {
      qb.innerJoinAndSelect("activity.ascents", "ascent");
    }

    const activities = await qb.getMany();

    if (!activities) {
      res
        .status(404)
        .json({ error: { code: 404, message: "No activities found." } });
      return;
    }

    if (activities.length === 1) {
      res.json({ data: activityModelToApi(activities[0]) });
      return;
    }
    res.json({ data: activities.map(activityModelToApi) });
  }

  async getAscents(req: express.Request, res: express.Response) {
    const whereClause: FindConditions<Ascent> = { user: { id: req.uid } };
    if (req.params.mountainId != null) {
      whereClause.mountain = { id: Number(req.params.mountainId) };
    }
    const ascents = await this.#dbConn.getRepository(Ascent).find({
      where: whereClause,
      order: { date: "DESC" },
      take: PAGE_SIZE,
      skip: PAGE_SIZE * Number(req.query.page),
    });
    res.json({ data: ascents.map(ascentModelToApi) });
  }

  async postAscent(req: express.Request, res: express.Response) {
    const ascent = this.#dbConn.getRepository(Ascent).create({
      user: { id: req.uid },
      mountain: { id: Number(req.query.mountain_id) },
      date: new Date(req.query.date as string),
      dateOnly: req.query.date_only == "true",
    });
    res.status(200).json({ data: { id: ascent.id } });
  }

  async getList(req: express.Request, res: express.Response) {
    const list = await this.#dbConn.getRepository(List).findOne({
      where: { id: Number(req.params.listId) },
      relations: ["mountains"],
    });

    if (list == null) {
      res.sendStatus(404);
      return;
    }
    if (list.private && (req.uid == null || req.uid !== list.owner.id)) {
      res.status(403).json({
        error: {
          code: 403,
          message: "You don't have permission to view this list.",
        },
      });
      return;
    }

    return res.json({ data: listModelToApi(list) });
  }

  // TODO: Suggest user use identical (or similar?) public list instead.
  // TODO: Some way to update lists, not just create.
  async postList(req: express.Request, res: express.Response) {
    const listJson = req.body as NewList;
    const list = new List();
    list.name = listJson.name;
    list.private = listJson.private;
    list.owner = new User();
    list.owner.id = req.uid;
    list.mountains = listJson.mountains.map((mountainId) => {
      const mountain = new Mountain();
      mountain.id = mountainId;
      return mountain;
    });
    await this.#dbConn.getRepository(List).save(list);
    res.sendStatus(200);
  }

  async getMountain(req: express.Request, res: express.Response) {
    if (req.query.include_ascents === "true" && req.uid === undefined) {
      res.status(403).json({
        error: {
          code: 403,
          message: "Must be authenticated to include ascents.",
        },
      });
      return;
    }

    const includeNearby = req.query.include_nearby;
    let includeRadius = 0;
    if (includeNearby === "true") {
      includeRadius = 100000;
    } else if (includeNearby !== "false") {
      includeRadius = parseInt(includeNearby as string, 10);
    }

    const mountain = await this.#dbConn
      .getRepository(Mountain)
      .findOne(req.params.mountainId);
    const resJson = mountainModelToApi(mountain);

    if (includeRadius) {
      /*
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
      */
      const nearby = await this.#dbConn
        .getRepository(Mountain)
        .createQueryBuilder("mountain")
        .select("mountain.*")
        // getRawMany won't automatically format location as GeoJSON, so we
        // override it manually here.
        .addSelect("ST_AsGeoJson(mountain.location)::json", "location")
        .addSelect(
          `ST_Distance(mountain.location, ST_GeomFromGeoJSON('${JSON.stringify(
            mountain.location
          )}'))`,
          "distance"
        )
        .where({
          location: Raw(
            (location) =>
              `ST_DWithin(${location}, ST_GeomFromGeoJSON(:mainLocation), :includeRadius)`,
            { mainLocation: mountain.location, includeRadius }
          ),
        })
        .orderBy("distance")
        .getRawMany();
      logger.info("nearby:", nearby);

      // Nearby will include the original mountain too, so 'slice' it off.
      resJson.nearby = nearby.slice(1).map(mountainModelToApi);
    }

    if (req.query.include_ascents === "true") {
      const ascents = await this.#dbConn.getRepository(Ascent).find({
        where: {
          user: { id: req.uid },
          mountain: { id: Number(req.params.mountainId) },
        },
        relations: ["activity", "user"],
      });
      logger.info("ascents:", ascents);
      resJson.ascents = ascents.map(ascentModelToApi);
    }

    res.json({ data: resJson });
  }

  async getMountains(_req: express.Request, res: express.Response) {
    const mountains = await this.#dbConn
      .getRepository(Mountain)
      .find({ select: ["id", "name", "location"] });
    res.json({ data: mountains.map(mountainModelToApi) });
  }

  async getUser(req: express.Request, res: express.Response) {
    const user = await this.#dbConn
      .getRepository(User)
      .createQueryBuilder("user")
      .select('"user".*')
      .addSelect("COUNT(DISTINCT(activity.id))", "activityCount")
      .addSelect("COUNT(DISTINCT(ascent.id))", "ascentCount")
      .leftJoin("user.activities", "activity")
      .leftJoin("user.ascents", "ascent")
      .where({ id: req.uid })
      .groupBy("user.id")
      .getRawOne();
    res.json({ data: userModelToApi(user) });
  }

  async postUser(req: express.Request, res: express.Response) {
    const name = req.query.name as string;
    const id = req.query.id as string;

    // Ensure user has already been registered with firebase.
    if (auth().getUser(id) == null) {
      res.status(400).json({
        error: {
          code: 400,
          message: "UID does not correspond to active firebase user.",
        },
      });
      return;
    }

    const user = new User();
    user.name = name;
    user.id = id;
    this.#dbConn.manager.save(user);

    res.sendStatus(200);
  }

  // Deletes a user from both firebase and the local db.
  async deleteUser(req: express.Request, res: express.Response) {
    const uid = req.query.uid as string;

    const userRepo = this.#dbConn.getRepository(User);
    try {
      const user = await userRepo.findOne(uid);
      await admin.auth().deleteUser(uid);
      await userRepo.delete(user);
    } catch (error) {
      res.status(400).json({ error: { code: 400, message: error.name } });
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

    this.#dbConn.getRepository(Activity).create({
      user: { id: req.uid },
      source: ActivitySource.gpx,
      name: geoJson.features[0].properties.name,
      date: geoJson.features[0].properties.time,
      path: geoJson.features[0].geometry,
    });

    res.sendStatus(200);
  }
}

export default ClientService;
