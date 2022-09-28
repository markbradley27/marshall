import express from "express";
import { body, param } from "express-validator";
import { DataSource } from "typeorm";

import { ApiError } from "../../error";
import { maybeVerifyIdToken, verifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { List } from "../../model/List";
import { isArrayOfNumbers } from "../../validators";

import { listModelToApi } from "./list_api_model";

export class ListRoutes {
  router: express.Router;

  #db: DataSource;

  constructor(db: DataSource) {
    this.#db = db;

    this.router = express.Router();
    // TODO: Revamp.
    this.router.get(
      "/list/:listId",
      param("listId").isNumeric(),
      checkValidation,
      maybeVerifyIdToken,
      this.getList.bind(this)
    );
    // TODO: Suggest user use identical (or similar?) public list instead.
    // TODO: Some way to update lists, not just create.
    this.router.post(
      "/list",
      body("name").isString().notEmpty(),
      body("isPrivate").isBoolean().toBoolean(),
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
      relations: ["mountains"],
    });

    if (list == null) {
      return next(new ApiError(404, `list ${req.params.listId} not found`));
    }
    if (list.private && (req.uid == null || req.uid !== list.owner.id)) {
      return next(
        new ApiError(
          403,
          `insufficient permission to view list ${req.params.listId}`
        )
      );
    }

    return res.json(listModelToApi(list));
  }

  async postList(req: express.Request, res: express.Response) {
    console.log("req.body:", req.body);
    await this.#db.transaction(async (entityManager) => {
      const insertionResult = await entityManager.getRepository(List).insert({
        name: req.body.name,
        private: req.body.isPrivate,
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
