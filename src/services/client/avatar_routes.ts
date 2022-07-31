import fsPromises from "node:fs/promises";
import path from "path";

import express from "express";
import { param } from "express-validator";
import multer from "multer";
import { Logger } from "tslog";

import { ApiError } from "../../error";
import { verifyIdToken } from "../../middleware/auth";
import { checkValidation } from "../../middleware/validation";

const logger = new Logger();

const AVATARS_DIR = path.join(process.env.UPLOADS_DIR, "/avatars/");

const avatarStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, AVATARS_DIR);
  },
  filename: function (req, _, cb) {
    cb(null, req.uid + ".png");
  },
});
const avatarUpload = multer({ storage: avatarStorage });

export class AvatarRoutes {
  router: express.Router;

  constructor() {
    this.router = express.Router();
    this.router.get(
      "/avatar/:userId",
      param("userId").isString().notEmpty(),
      checkValidation,
      this.getAvatar.bind(this)
    );
    this.router.put(
      "/avatar",
      verifyIdToken,
      avatarUpload.single("avatar"),
      this.putAvatar.bind(this)
    );
  }
  async getAvatar(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const files = await fsPromises.readdir(AVATARS_DIR);
    for (const file of files) {
      if (file.startsWith(req.params.userId)) {
        res.sendFile(path.join(AVATARS_DIR, file));
        return;
      }
    }
    return next(
      new ApiError(404, `avatar for user ${req.params.userId} not found`)
    );
  }

  // TODO: Do some file type/size checking/transcoding.
  putAvatar(req: express.Request, res: express.Response) {
    logger.info(`Uploaded avatar for ${req.uid}.`);
    res.sendStatus(200);
  }
}
