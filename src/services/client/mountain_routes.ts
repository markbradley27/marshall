import express from "express";
import { body, param, query } from "express-validator";
import { DataSource } from "typeorm";

import { SUMMIT_PATH_PROXIMITY_THRESHOLD_M } from "../../consts";
import { maybeVerifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { Mountain } from "../../model/Mountain";
import { isLineStringGeometry } from "../../validators";

import { mountainModelToApi } from "./mountain_api_model";

export class MountainRoutes {
  router: express.Router;

  #db: DataSource;

  constructor(db: DataSource) {
    this.#db = db;

    this.router = express.Router();

    // Ascents are ordered reverse chronologically.
    // includeAscents=true: includes all ascents the user is allowed to see
    // includeAscentsBy=uid: include all ascents the user is allowed to see by
    //                       the given user
    //
    // Nearby mountains are ordered by ascending distance.
    // includeNearbyWithin=N: includes nearby mountains within N meters
    this.router.get(
      "/mountain/:mountainId",
      param("mountainId").isNumeric(),
      query("includeAscents").optional().isBoolean().toBoolean(),
      query("includeAscentsBy").optional().isString().notEmpty(),
      query("includeNearbyWithin").optional().isNumeric().notEmpty(),
      checkValidation,
      maybeVerifyIdToken,
      this.getMountain.bind(this)
    );

    // Mountains are returned in alphabetical order, unless an option overrides
    // that.
    this.router.get("/mountains", this.getMountains.bind(this));
    // alongPath: only returns mountains near enough to the path
    this.router.post(
      "/mountains",
      body("alongPath").optional().custom(isLineStringGeometry),
      checkValidation,
      this.getMountains.bind(this)
    );
  }

  // TODO: Support FOLLOWERS_ONLY.
  async getMountain(req: express.Request, res: express.Response) {
    const query = this.#db
      .getRepository(Mountain)
      .createQueryBuilder("mountain")
      .where("mountain.id = :mountainId", {
        mountainId: req.params.mountainId,
      });

    if (req.query.includeAscents || req.query.includeAscentsBy) {
      query.orderBy({ "ascent.date": "DESC", "ascent.time": "DESC" });
      if (req.query.includeAscents) {
        query.leftJoinAndSelect("mountain.ascents", "ascent");
        if (req.uid != null) {
          query.andWhere(
            "(ascent is NULL or ascent.privacy = 'PUBLIC' or (ascent.privacy = 'PRIVATE' and ascent.userId = :uid))",
            { uid: req.uid }
          );
        } else {
          query.andWhere("(ascent is NULL or ascent.privacy = 'PUBLIC')");
        }
      } else if (req.query.includeAscentsBy) {
        query.leftJoinAndSelect(
          "mountain.ascents",
          "ascent",
          "ascent.userId = :ascentsUid",
          { ascentsUid: req.query.includeAscentsBy }
        );
        if (req.query.includeAscentsBy !== req.uid) {
          query.andWhere("(ascent is NULL or ascent.privacy = 'PUBLIC')");
        }
      }
    }

    const mountain = await query.getOne();

    let nearby = [];
    if (req.query.includeNearbyWithin) {
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
          { nearbyRadius: req.query.includeNearbyWithin }
        )
        .setParameter("mountainLocation", mountain.location)
        .andWhere("nearby.id != :mountainId", { mountainId: mountain.id })
        .orderBy("distance", "ASC");

      nearby = await nearbyQuery.getRawMany();
    }

    res.json({
      ...mountainModelToApi(mountain),
      nearby:
        req.query.includeNearbyWithin != null
          ? nearby.map(mountainModelToApi)
          : undefined,
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
    res.json(mountains.map(mountainModelToApi));
  }
}
