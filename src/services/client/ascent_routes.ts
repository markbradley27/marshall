import express from "express";
import { param, query } from "express-validator";
import { find as findTz } from "geo-tz";
import { DateTime } from "luxon";
import { Connection, FindConditions, FindManyOptions } from "typeorm";

import { verifyIdToken } from "../../middleware/auth";
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
      "/ascents/:mountainId?",
      param("mountainId").optional().isNumeric(),
      query("include_mountains").optional().isBoolean(),
      query("page").default(0).isNumeric(),
      checkValidation,
      verifyIdToken,
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

  async getAscents(req: express.Request, res: express.Response) {
    const findOptions: FindManyOptions<Ascent> = {
      where: { user: { id: req.uid } },
      order: { date: "DESC" },
      take: PAGE_SIZE,
      skip: PAGE_SIZE * Number(req.query.page),
    };
    if (req.params.mountainId != null) {
      (findOptions.where as FindConditions<Ascent>).mountain = {
        id: Number(req.params.mountainId),
      };
    }
    if (req.query.include_mountains === "true") {
      findOptions.relations = ["mountain"];
    }
    const ascents = await this.#dbConn.getRepository(Ascent).find(findOptions);
    res.json({ data: ascents.map(ascentModelToApi) });
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

    const insertResult = await this.#dbConn.getRepository(Ascent).insert({
      user: { id: req.uid },
      privacy: req.query.privacy as PrivacySetting,
      date: date.toUTC(),
      dateOnly,
      mountain: { id: Number(req.query.mountainId) },
    });
    // Returns id of inserted ascent.
    res.status(200).json({ data: { id: insertResult.identifiers[0] } });
  }
}
