import express from "express";
import { body, param, query } from "express-validator";
import { DateTime } from "luxon";
import { DataSource } from "typeorm";

import { ApiError } from "../../error";
import { maybeVerifyIdToken, verifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { Activity, ActivitySource } from "../../model/Activity";
import { Ascent } from "../../model/Ascent";
import { PrivacySetting } from "../../model/privacy_setting";
import {
  isArrayOfNumbers,
  isIsoDate,
  isLineStringGeometry,
  isOptionalIsoTime,
  isTimeZone,
} from "../../validators";

import { activityModelToApi } from "./activity_api_model";

// TODO: Set this back to 20.
const PAGE_SIZE = 5;

export class ActivityRoutes {
  router: express.Router;

  #db: DataSource;

  constructor(db: DataSource) {
    this.#db = db;

    this.router = express.Router();
    // TODO: Support FOLLOWERS_ONLY.
    this.router.get(
      "/activity/:activityId",
      param("activityId").isNumeric(),
      query("includeAscents").optional().isBoolean(),
      checkValidation,
      maybeVerifyIdToken,
      this.getActivity.bind(this)
    );
    // TODO: Finish re-vamping.
    // TODO: Support FOLLOWERS_ONLY.
    this.router.get(
      "/activities",
      query("userId").optional().isString(),
      query("includeAscents").optional().isBoolean(),
      query("onlyWithAscents").optional().isBoolean(),
      query("page").default(0).isNumeric(),
      checkValidation,
      maybeVerifyIdToken,
      this.getActivities.bind(this)
    );
    this.router.post(
      "/activity",
      body("privacy").isIn(Object.values(PrivacySetting)),
      body("source").isIn(Object.values(ActivitySource)),
      body("name").isString().notEmpty(),
      body("date").custom(isIsoDate),
      body("time").custom(isOptionalIsoTime),
      body("timeZone").custom(isTimeZone),
      body("path").optional().custom(isLineStringGeometry),
      body("description").optional().isString(),
      body("ascendedMountainIds").custom(isArrayOfNumbers),
      checkValidation,
      verifyIdToken,
      this.postActivity.bind(this)
    );
  }

  async getActivity(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const activity = await this.#db.getRepository(Activity).findOne({
      where: { id: Number(req.params.activityId) },
      relations: {
        ascents:
          req.query.includeAscents === "true" ? { mountain: true } : false,
      },
    });

    if (activity == null) {
      next(new ApiError(404, `no activity with id ${req.params.activityId}`));
      return;
    }

    if (
      activity.privacy === PrivacySetting.PRIVATE &&
      req.uid != activity.userId
    ) {
      next(
        new ApiError(
          403,
          `insufficient permission to view activity ${req.params.activityId}`
        )
      );
      return;
    }

    res.json(activityModelToApi(activity));
  }

  async getActivities(
    req: express.Request,
    res: express.Response
    //next: express.NextFunction
  ) {
    const activityRepo = this.#db.getRepository(Activity);
    const qb = activityRepo
      .createQueryBuilder("activity")
      .orderBy("activity.date", "DESC")
      .limit(PAGE_SIZE);
    // TODO: Handle public or private with auth.
    if (req.query.userId != null) {
      qb.where("activity.userId = :userId", { userId: req.query.userId });
    }
    if (req.query.includeAscents === "true") {
      qb.leftJoinAndSelect("activity.ascents", "ascents");
      qb.leftJoinAndSelect("ascents.mountain", "mountain");
    }
    if (req.query.onlyWithAscents === "true") {
      qb.innerJoinAndSelect("activity.ascents", "ascent");
    }

    const activities = await qb.getMany();

    res.json(activities.map(activityModelToApi));
  }

  async postActivity(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    let dateTimeStr = req.query.date as string;
    if (req.query.time) {
      dateTimeStr += "T" + req.query.time;
    }
    const dateTime = DateTime.fromISO(dateTimeStr, {
      zone: req.query.timeZone as string,
    });
    if (dateTime > DateTime.now()) {
      return next(
        new ApiError(400, "activity date/time cannot be in the future")
      );
    }

    await this.#db.transaction(async (transactionalEntityManager) => {
      const insertedActivity = await transactionalEntityManager
        .getRepository(Activity)
        .insert({
          privacy: req.body.privacy,
          source: req.body.source,
          name: req.body.name,
          date: req.body.date,
          time: req.body.time || undefined,
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
      res.json({ id: insertedActivityId });
    });
  }
}
