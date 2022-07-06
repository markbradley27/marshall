import express from "express";
import { param, query } from "express-validator";
import admin from "firebase-admin";
import { auth } from "firebase-admin";
import { Connection } from "typeorm";

import { verifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";
import { User } from "../../model/User";

import { userModelToApi } from "./user_api_model";

export class UserRoutes {
  router: express.Router;

  #dbConn: Connection;

  constructor(dbConn: Connection) {
    this.#dbConn = dbConn;

    this.router = express.Router();
    this.router.get(
      "/user/:userId",
      param("userId").isString(),
      checkValidation,
      verifyIdToken,
      this.getUser.bind(this)
    );
    this.router.post(
      "/user/:userId",
      param("userId").isString(),
      query("name").isString(),
      checkValidation,
      verifyIdToken,
      this.postUser.bind(this)
    );
    this.router.delete(
      "/user/:userId",
      param("userId").isString(),
      checkValidation,
      verifyIdToken,
      this.deleteUser.bind(this)
    );
  }

  // TODO: Allow getting info about other users.
  async getUser(req: express.Request, res: express.Response) {
    const user = await this.#dbConn
      .getRepository(User)
      .createQueryBuilder("user")
      .select('"user".*')
      .addSelect("COUNT(DISTINCT(activity.id))", "activityCount")
      .addSelect("COUNT(DISTINCT(ascent.id))", "ascentCount")
      .leftJoin("user.activities", "activity")
      .leftJoin("user.ascents", "ascent")
      .where({ id: req.uid })
      .groupBy("user.id")
      .getRawOne();
    res.json({ data: userModelToApi(user) });
  }

  // Creates or updates the given user in both firebase and the local DB.
  async postUser(req: express.Request, res: express.Response) {
    const uid = req.params.userId as string;
    const name = req.query.name as string;

    // Users can only be modified by that authenticated user.
    if (uid != req.uid) {
      res.sendStatus(500);
      return;
    }

    // Update firebase.
    await auth().updateUser(uid, { displayName: name });

    // Update local DB.
    const userRepo = this.#dbConn.getRepository(User);
    const user = new User();
    user.id = uid;
    user.name = name;
    await userRepo.save(user);

    res.sendStatus(200);
  }

  // Deletes a user from both firebase and the local DB.
  async deleteUser(req: express.Request, res: express.Response) {
    const uid = req.params.userId as string;

    // Allow deletion iff the user being deleted is also the authenticated user.
    if (uid != req.uid) {
      res.sendStatus(500);
      return;
    }

    const userRepo = this.#dbConn.getRepository(User);
    try {
      await userRepo.delete({ id: uid });
      await admin.auth().deleteUser(uid);
    } catch (error) {
      res.status(400).json({ error: { code: 400, message: error.name } });
      return;
    }

    res.sendStatus(200);
  }
}
