import express from "express";
import { param } from "express-validator";
import { Connection } from "typeorm";

import { maybeVerifyIdToken, verifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { List } from "../../model/List";
import { Mountain } from "../../model/Mountain";
import { User } from "../../model/User";

import { listModelToApi } from "./list_api_model";

interface NewList {
  name: string;
  private: boolean;
  mountains: number[];
}

export class ListRoutes {
  router: express.Router;

  #dbConn: Connection;

  constructor(dbConn: Connection) {
    this.#dbConn = dbConn;

    this.router = express.Router();
    this.router.get(
      "/list/:listId",
      param("listId").isNumeric(),
      checkValidation,
      maybeVerifyIdToken,
      this.getList.bind(this)
    );
    // TODO: Validate json body too.
    this.router.post(
      "/list/:listId?",
      param("listId").optional().isNumeric(),
      checkValidation,
      verifyIdToken,
      this.postList.bind(this)
    );
  }

  async getList(req: express.Request, res: express.Response) {
    const list = await this.#dbConn.getRepository(List).findOne({
      where: { id: Number(req.params.listId) },
      relations: ["mountains"],
    });

    if (list == null) {
      res.sendStatus(404);
      return;
    }
    if (list.private && (req.uid == null || req.uid !== list.owner.id)) {
      res.status(403).json({
        error: {
          code: 403,
          message: "You don't have permission to view this list.",
        },
      });
      return;
    }

    return res.json({ data: listModelToApi(list) });
  }

  // TODO: Suggest user use identical (or similar?) public list instead.
  // TODO: Some way to update lists, not just create.
  async postList(req: express.Request, res: express.Response) {
    const listJson = req.body as NewList;
    const list = new List();
    list.name = listJson.name;
    list.private = listJson.private;
    list.owner = new User();
    list.owner.id = req.uid;
    list.mountains = listJson.mountains.map((mountainId) => {
      const mountain = new Mountain();
      mountain.id = mountainId;
      return mountain;
    });
    await this.#dbConn.getRepository(List).save(list);
    res.sendStatus(200);
  }
}
