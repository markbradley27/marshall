import express from "express";
import { body, oneOf, param, query } from "express-validator";
import { DataSource } from "typeorm";

import { SUMMIT_PATH_PROXIMITY_THRESHOLD_M } from "../../consts";
import { maybeVerifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { Mountain } from "../../model/Mountain";

import { mountainModelToApi } from "./mountain_api_model";

const DEFAULT_NEARBY_MOUNTAINS_RADIUS = 30000; // m

export class MountainRoutes {
  router: express.Router;

  #db: DataSource;

  constructor(db: DataSource) {
    this.#db = db;

    this.router = express.Router();
    // includeAscents (ordered in reverse chronological order):
    //   true: will include all ascents the user is allowed to see
    //   uid: will include all ascents by the given uid that the user is allowed
    //        to see
    // includeNearby (ordered by ascending distance):
    //   true: will include nearby mountains within 30km
    //   n: will include nearby mountains within n meters
    this.router.get(
      "/mountain/:mountainId",
      param("mountainId").isNumeric(),
      oneOf([
        query("includeAscents").optional().isBoolean(),
        query("includeAscents").optional().isString(),
      ]),
      oneOf([
        query("includeNearby").optional().isBoolean(),
        query("includeNearby").optional().isNumeric(),
      ]),
      checkValidation,
      maybeVerifyIdToken,
      this.getMountain.bind(this)
    );
    // Mountains are returned in alphabetical order, unless an option overrides
    // that.
    this.router.get("/mountains", this.getMountains.bind(this));
    // alongPath: only returns mountains near enough to the path, should valid
    //            geoJSON.
    this.router.post(
      "/mountains",
      // TODO: Validate that this is geoJSON.
      body("alongPath").optional().isObject(),
      checkValidation,
      this.getMountains.bind(this)
    );
  }

  // TODO: Support FOLLOWERS_ONLY.
  async getMountain(req: express.Request, res: express.Response) {
    const mountainId = Number(req.params.mountainId);

    const query = this.#db
      .getRepository(Mountain)
      .createQueryBuilder("mountain")
      .where("mountain.id = :mountainId", { mountainId });

    if (req.query.includeAscents != null) {
      query.orderBy({ "ascent.date": "DESC", "ascent.time": "DESC" });
      if (req.query.includeAscents === "true") {
        query.leftJoinAndSelect("mountain.ascents", "ascent");
        if (req.uid != null) {
          query.andWhere(
            "(ascent is NULL or ascent.privacy = 'PUBLIC' or (ascent.privacy = 'PRIVATE' and ascent.userId = :uid))",
            { uid: req.uid }
          );
        } else {
          query.andWhere("(ascent is NULL or ascent.privacy = 'PUBLIC')");
        }
      } else if (req.query.includeAscents !== "false") {
        const ascentsUid = req.query.includeAscents as string;
        query.leftJoinAndSelect(
          "mountain.ascents",
          "ascent",
          "ascent.userId = :ascentsUid",
          { ascentsUid }
        );
        if (ascentsUid !== req.uid) {
          query.andWhere("(ascent is NULL or ascent.privacy = 'PUBLIC')");
        }
      }
    }

    const mountain = await query.getOne();

    let nearby = [];
    if (req.query.includeNearby != null && req.query.nearbyRadius !== "false") {
      const nearbyRadius =
        req.query.includeNearby === "true"
          ? DEFAULT_NEARBY_MOUNTAINS_RADIUS
          : Number(req.query.includeNearby);

      const nearbyQuery = this.#db
        .getRepository(Mountain)
        .createQueryBuilder("nearby")
        .select("nearby.*")
        .addSelect(
          "ST_Distance(nearby.location, ST_GeomFromGeoJSON(:mountainLocation))",
          "distance"
        )
        .where(
          "ST_DWithin(nearby.location, ST_GeomFromGeoJSON(:mountainLocation), :nearbyRadius)",
          { nearbyRadius }
        )
        .setParameter("mountainLocation", mountain.location)
        .andWhere("nearby.id != :mountainId", { mountainId: mountain.id })
        .orderBy("distance", "ASC");

      nearby = await nearbyQuery.getRawMany();
    }

    res.json({
      data: {
        ...mountainModelToApi(mountain),
        nearby:
          req.query.includeNearby != null
            ? nearby.map(mountainModelToApi)
            : undefined,
      },
    });
  }

  async getMountains(req: express.Request, res: express.Response) {
    const query = this.#db
      .getRepository(Mountain)
      .createQueryBuilder("mountain")
      .orderBy("mountain.name", "ASC");

    if (req.body.alongPath != null) {
      query.andWhere(
        "ST_DWithin(mountain.location, ST_GeomFromGeoJSON(:alongPath), :threshold)",
        {
          alongPath: req.body.alongPath,
          threshold: SUMMIT_PATH_PROXIMITY_THRESHOLD_M,
        }
      );
    }

    const mountains = await query.getMany();
    res.json({ data: mountains.map(mountainModelToApi) });
  }
}
