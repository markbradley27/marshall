import express from "express";
import { param, query } from "express-validator";
import { find as findTz } from "geo-tz";
import { DateTime } from "luxon";
import { Connection, FindOneOptions } from "typeorm";

import { maybeVerifyIdToken, verifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { Ascent } from "../../model/Ascent";
import { Mountain } from "../../model/Mountain";
import { PrivacySetting } from "../../model/privacy_setting";

import { ascentModelToApi } from "./ascent_api_model";

const PAGE_SIZE = 20;
const ISO_TIME_INCLUDES_TZ = /[+-]\d{2}:\d{2}|Z$/;

export class AscentRoutes {
  router: express.Router;

  #dbConn: Connection;

  constructor(dbConn: Connection) {
    this.#dbConn = dbConn;

    this.router = express.Router();

    this.router.get(
      "/ascent/:ascentId",
      param("ascentId").isNumeric(),
      query("includeMountain").optional().isBoolean(),
      checkValidation,
      maybeVerifyIdToken,
      this.getAscent.bind(this)
    );

    // Default order is by date descending.
    this.router.get(
      "/ascents",
      query("ascentId").optional().isNumeric(),
      query("mountainId").optional().isNumeric(),
      query("userId").optional().isString(),
      query("includeMountains").default(false).isBoolean(),
      query("page").default(0).isNumeric(),
      checkValidation,
      maybeVerifyIdToken,
      this.getAscents.bind(this)
    );

    // date may be a simple date (YYYY-MM-DD) or a datetime
    // (YYYY-MM-DDTHH:MM:SS). If a datetime is provided with a timezone offset
    // (...+/-XX:XX), the provided offset will be used. If no timezone offset is
    // provided, it will be assumed the timestamp is from the timezone of the
    // mountain.
    //
    // TODO: Better validation of date, privacy enum.
    this.router.post(
      "/ascent",
      query("privacy").isString(),
      query("date").isString(),
      query("mountainId").isNumeric(),
      checkValidation,
      verifyIdToken,
      this.postAscent.bind(this)
    );
  }

  // TODO: Support followers only.
  async getAscent(req: express.Request, res: express.Response) {
    const findOptions: FindOneOptions<Ascent> = {
      where: { id: req.params.ascentId },
    };
    if (
      req.query.includeMountain &&
      (req.query.includeMountain as string).toLowerCase() === "true"
    ) {
      findOptions.relations = ["mountain"];
    }
    const ascent = await this.#dbConn
      .getRepository(Ascent)
      .findOne(findOptions);

    if (!ascent) {
      res.status(404).json({
        error: {
          code: 404,
          message: `Ascent ${req.params.ascentId} not found.`,
        },
      });
      return;
    }
    if (ascent.privacy !== PrivacySetting.PUBLIC && ascent.userId != req.uid) {
      res.status(403).json({
        error: {
          code: 403,
          message: `You don't have permission to view ascent ${req.params.ascentId}`,
        },
      });
      return;
    }

    res.json({ data: ascentModelToApi(ascent) });
  }

  // TODO: Support FOLLOWERS_ONLY.
  async getAscents(req: express.Request, res: express.Response) {
    const page = Number(req.query.page);

    const ascentsQuery = this.#dbConn
      .getRepository(Ascent)
      .createQueryBuilder("ascent")
      .take(PAGE_SIZE)
      .skip(page * PAGE_SIZE)
      .orderBy("ascent.date", "DESC");

    if (req.uid) {
      ascentsQuery.andWhere(
        "(ascent.userId = :uid or ascent.privacy = 'PUBLIC')",
        { uid: req.uid }
      );
    } else {
      ascentsQuery.andWhere("ascent.privacy = 'PUBLIC'");
    }

    if (req.query.ascentId) {
      ascentsQuery.andWhere("ascent.id = :ascentId", {
        ascentId: req.query.ascentId,
      });
    }
    if (req.query.mountainId) {
      ascentsQuery.andWhere("ascent.mountainId = :mountainId", {
        mountainId: req.query.mountainId,
      });
    }
    if (req.query.userId) {
      ascentsQuery.andWhere("ascent.userId = :userId", {
        userId: req.query.userId,
      });
    }
    if (req.query.includeMountains) {
      ascentsQuery.leftJoinAndSelect("ascent.mountain", "mountain");
    }

    const [ascents, count] = await ascentsQuery.getManyAndCount();

    res.json({
      data: {
        ascents: ascents.map(ascentModelToApi),
        count: count,
        page: page,
      },
    });
  }

  async postAscent(req: express.Request, res: express.Response) {
    const dateStr = req.query.date as string;
    const dateOnly = !dateStr.includes("T");
    const dateTimeOpts: any = {};

    // If it's a date-only, the time zone doesn't matter, so we set it to UTC
    // just to be explicit and consistent.
    if (dateOnly) {
      dateTimeOpts.zone = "UTC";
    }

    if (!dateOnly && !ISO_TIME_INCLUDES_TZ.test(dateStr)) {
      const mountain: Mountain = await this.#dbConn
        .getRepository(Mountain)
        .findOne(Number(req.query.mountainId));
      const mountainTzs = findTz(
        mountain.location.coordinates[1],
        mountain.location.coordinates[0]
      );
      // Always assume the first timezone. Probably good enough.
      dateTimeOpts.zone = mountainTzs[0];
    }

    const date = DateTime.fromISO(dateStr, dateTimeOpts);

    if (date > DateTime.now()) {
      res
        .status(400)
        .json({ error: "ascent date/time cannot be in the future" });
      return;
    }

    const insertResult = await this.#dbConn.getRepository(Ascent).insert({
      user: { id: req.uid },
      privacy: req.query.privacy as PrivacySetting,
      date: date.toUTC(),
      dateOnly,
      mountain: { id: Number(req.query.mountainId) },
    });
    // Returns id of inserted ascent.
    res.status(200).json({ data: { id: insertResult.identifiers[0].id } });
  }
}
