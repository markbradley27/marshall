import express from "express";
import { body, param } from "express-validator";
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
      body("name").optional().isString(),
      body("location").optional().isString(),
      // TODO: Validate enum values.
      body("gender").optional().isString(),
      body("bio").optional().isString(),
      body("activitiesDefaultPrivate").optional().isBoolean(),
      body("ascentsDefaultPrivate").optional().isBoolean(),
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

  // Creates or updates the given user.
  //
  // The user must already exist in firebase.
  // The user will be created or updated in the local db.
  async postUser(req: express.Request, res: express.Response) {
    const uid = req.params.userId as string;

    // Users can only be modified by that authenticated user.
    if (uid != req.uid) {
      res.sendStatus(500);
      return;
    }

    // Update firebase.
    if (req.body.name) {
      await auth().updateUser(uid, { displayName: req.body.name });
    }

    // Update local DB.
    const userRepo = this.#dbConn.getRepository(User);
    const user = new User();
    user.id = uid;
    user.name = req.body.name;
    user.location = req.body.location;
    user.gender = req.body.gender;
    user.bio = req.body.bio;
    user.activitiesDefaultPrivate = req.body.activitiesDefaultPrivate;
    user.ascentsDefaultPrivate = req.body.ascentsDefaultPrivate;
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
