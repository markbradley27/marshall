import express from "express";
import { param, query } from "express-validator";
import { Connection, FindConditions, FindManyOptions } from "typeorm";

import { verifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { Ascent } from "../../model/Ascent";

import { ascentModelToApi } from "./ascent_api_model";

const PAGE_SIZE = 20;

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
    const insertResult = await this.#dbConn.getRepository(Ascent).insert({
      user: { id: req.uid },
      mountain: { id: Number(req.query.mountain_id) },
      date: new Date(req.query.date as string),
      dateOnly: req.query.date_only == "true",
    });
    // Returns id of inserted ascent.
    res.status(200).json({ data: { id: insertResult.identifiers[0] } });
  }
}
