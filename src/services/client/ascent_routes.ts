import express from "express";
import { param, query } from "express-validator";
import { DateTime } from "luxon";
import { Connection, FindOneOptions } from "typeorm";

import { maybeVerifyIdToken, verifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { Ascent } from "../../model/Ascent";
import { Mountain } from "../../model/Mountain";
import { PrivacySetting } from "../../model/privacy_setting";

import { ascentModelToApi } from "./ascent_api_model";

const PAGE_SIZE = 20;

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

    // Default order is by date, time descending.
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

    // It is always assumed that the provided time is specified in the time zone
    // of the mountain.
    //
    // TODO: Better validation of date, privacy enum.
    this.router.post(
      "/ascent",
      query("privacy").isString(),
      query("date").isString(),
      query("time").optional().isString(),
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
      .orderBy({ "ascent.date": "DESC", "ascent.time": "DESC" });

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
    const mountain: Mountain = await this.#dbConn
      .getRepository(Mountain)
      .findOne(Number(req.query.mountainId));
    const timeZone = mountain.timeZone;

    let dateTimeStr = req.query.date as string;
    if (req.query.time) {
      dateTimeStr += "T" + req.query.time;
    }
    const dateTime = DateTime.fromISO(dateTimeStr, { zone: timeZone });
    if (dateTime > DateTime.now()) {
      res
        .status(400)
        .json({ error: "ascent date/time cannot be in the future" });
      return;
    }

    const insertResult = await this.#dbConn.getRepository(Ascent).insert({
      user: { id: req.uid },
      privacy: req.query.privacy as PrivacySetting,
      date: req.query.date as string,
      time: req.query.time != null ? (req.query.time as string) : undefined,
      timeZone,
      mountain: { id: Number(req.query.mountainId) },
    });
    // Returns id of inserted ascent.
    res.status(200).json({ data: { id: insertResult.identifiers[0].id } });
  }
}
