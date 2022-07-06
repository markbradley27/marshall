import express from "express";
import { oneOf, param, query } from "express-validator";
import { Connection, Raw } from "typeorm";

import { maybeVerifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { Ascent } from "../../model/Ascent";
import { Mountain } from "../../model/Mountain";

import { ascentModelToApi } from "./ascent_api_model";
import { mountainModelToApi } from "./mountain_api_model";

export class MountainRoutes {
  router: express.Router;

  #dbConn: Connection;

  constructor(dbConn: Connection) {
    this.#dbConn = dbConn;

    this.router = express.Router();
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
}
