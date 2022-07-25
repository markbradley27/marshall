import express from "express";
import { param, query } from "express-validator";
import { DataSource } from "typeorm";

import { verifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { Activity } from "../../model/Activity";

import { activityModelToApi } from "./activity_api_model";

const PAGE_SIZE = 20;

export class ActivityRoutes {
  router: express.Router;

  #db: DataSource;

  constructor(db: DataSource) {
    this.#db = db;

    this.router = express.Router();
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
}
