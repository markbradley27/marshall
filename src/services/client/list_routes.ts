import express from "express";
import { body, param, query } from "express-validator";
import { DataSource } from "typeorm";

import { API_PAGE_SIZE } from "../../consts";
import { ApiError } from "../../error";
import { maybeVerifyIdToken, verifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { List } from "../../model/List";
import { PrivacySetting } from "../../model/privacy_setting";
import { isArrayOfNumbers } from "../../validators";

import { listModelToApi } from "./list_api_model";

export class ListRoutes {
  router: express.Router;

  #db: DataSource;

  constructor(db: DataSource) {
    this.#db = db;

    this.router = express.Router();
    this.router.get(
      "/list/:listId",
      param("listId").isNumeric(),
      checkValidation,
      maybeVerifyIdToken,
      this.getList.bind(this)
    );
    this.router.get(
      "/lists",
      query("page").default(0).isNumeric(),
      checkValidation,
      maybeVerifyIdToken,
      this.getLists.bind(this)
    );

    // TODO: Suggest user use identical (or similar?) public list instead.
    // TODO: Some way to update lists, not just create.
    this.router.post(
      "/list",
      body("name").isString().notEmpty(),
      body("privacy").isIn(Object.values(PrivacySetting)),
      body("description").optional().isString(),
      body("mountainIds").custom(isArrayOfNumbers),
      checkValidation,
      verifyIdToken,
      this.postList.bind(this)
    );
  }

  async getList(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const list = await this.#db.getRepository(List).findOne({
      where: { id: Number(req.params.listId) },
      relations: { mountains: true },
    });

    if (list == null) {
      return next(new ApiError(404, `list ${req.params.listId} not found`));
    }
    if (
      list.privacy !== PrivacySetting.PUBLIC &&
      (req.uid == null || req.uid !== list.owner.id)
    ) {
      return next(
        new ApiError(
          403,
          `insufficient permission to view list ${req.params.listId}`
        )
      );
    }

    return res.json(listModelToApi(list));
  }

  async getLists(req: express.Request, res: express.Response) {
    const page = Number(req.query.page);

    const query = this.#db
      .getRepository(List)
      .createQueryBuilder("list")
      .leftJoinAndSelect("list.mountains", "mountain")
      .take(API_PAGE_SIZE)
      .skip(page * API_PAGE_SIZE)
      .orderBy("list.name", "ASC");

    if (req.uid) {
      query.andWhere("(list.ownerId = :uid or list.privacy = 'PUBLIC')", {
        uid: req.uid,
      });
    } else {
      query.andWhere("list.privacy = 'PUBLIC'");
    }

    const [lists, count] = await query.getManyAndCount();
    return res.json({
      lists: lists.map(listModelToApi),
      count,
      page,
    });
  }

  async postList(req: express.Request, res: express.Response) {
    await this.#db.transaction(async (entityManager) => {
      const insertionResult = await entityManager.getRepository(List).insert({
        name: req.body.name,
        privacy: req.body.privacy as PrivacySetting,
        description: req.body.description,
        owner: { id: req.uid },
      });

      const insertedListId = insertionResult.identifiers[0].id;
      for (const mountainId of req.body.mountainIds) {
        await entityManager
          .createQueryBuilder()
          .relation(List, "mountains")
          .of(insertedListId)
          .add(mountainId);
      }

      res.json({ id: insertedListId });
    });
  }
}
