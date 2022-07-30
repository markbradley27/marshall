import express from "express";
import { body, param, query } from "express-validator";
import { DateTime } from "luxon";
import { DataSource } from "typeorm";

import { verifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { Activity } from "../../model/Activity";
import { Ascent } from "../../model/Ascent";

import { activityModelToApi } from "./activity_api_model";

const PAGE_SIZE = 20;

export class ActivityRoutes {
  router: express.Router;

  #db: DataSource;

  constructor(db: DataSource) {
    this.#db = db;

    this.router = express.Router();
    // TODO: Re-vamp.
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
    this.router.post(
      "/activity",
      body("privacy").isString(),
      body("source").isString(),
      body("name").isString(),
      body("date").isString(),
      body("time").optional().isString(),
      body("timeZone").isString(),
      body("path").optional().isObject(),
      body("description").optional().isString(),
      body("ascendedMountainIds").isArray(),
      checkValidation,
      verifyIdToken,
      this.postActivity.bind(this)
    );
  }

  async getActivities(req: express.Request, res: express.Response) {
    const activityRepo = this.#db.getRepository(Activity);
    const qb = activityRepo
      .createQueryBuilder("activity")
      .where("activity.userId = :userId", { userId: req.uid })
      .orderBy("activity.date", "DESC")
      .limit(PAGE_SIZE);
    if (req.params.activityId != null) {
      qb.andWhere("activity.id = :id", { id: req.params.activityId });
    }
    if (req.query.include_ascents === "true") {
      qb.leftJoinAndSelect("activity.ascents", "ascents");
      qb.leftJoinAndSelect("ascents.mountain", "mountain");
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

  async postActivity(req: express.Request, res: express.Response) {
    let dateTimeStr = req.query.date as string;
    if (req.query.time) {
      dateTimeStr += "T" + req.query.time;
    }
    const dateTime = DateTime.fromISO(dateTimeStr, {
      zone: req.query.timeZone as string,
    });
    if (dateTime > DateTime.now()) {
      res
        .status(400)
        .json({ error: "activity date/time cannot be in the future" });
      return;
    }

    await this.#db.transaction(async (transactionalEntityManager) => {
      const insertedActivity = await transactionalEntityManager
        .getRepository(Activity)
        .insert({
          privacy: req.body.privacy,
          source: req.body.source,
          name: req.body.name,
          date: req.body.date,
          time: req.body.time,
          timeZone: req.body.timeZone,
          path: req.body.path,
          description: req.body.description,
          ascents: (req.body.ascendedMountainIds as number[]).map(
            (mountainId) => {
              return {
                privacy: req.body.privacy,
                date: req.body.date,
                timeZone: req.body.timeZone,
                mountainId,
                userId: req.uid,
              };
            }
          ),
          user: { id: req.uid },
        });
      const insertedActivityId = insertedActivity.identifiers[0].id;
      const ascentRepo = transactionalEntityManager.getRepository(Ascent);
      for (const ascendedMountainId of req.body.ascendedMountainIds) {
        ascentRepo.insert({
          privacy: req.body.privacy,
          date: req.body.date,
          timeZone: req.body.timeZone,
          activity: { id: insertedActivityId },
          mountain: { id: ascendedMountainId },
          user: { id: req.uid },
        });
      }
      res.status(200).json({ data: { id: insertedActivityId } });
    });
  }
}
