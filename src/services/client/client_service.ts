import express from "express";
import { DataSource } from "typeorm";

import { logApiRequest } from "../../middleware/debug";

import { ActivityRoutes } from "./activity_routes";
import { AscentRoutes } from "./ascent_routes";
import { AvatarRoutes } from "./avatar_routes";
import { GpxRoutes } from "./gpx_routes";
import { ListRoutes } from "./list_routes";
import { MountainRoutes } from "./mountain_routes";
import { UserRoutes } from "./user_routes";

export class ClientService {
  router: express.Router;

  constructor(db: DataSource) {
    const activityRoutes = new ActivityRoutes(db);
    const ascentRoutes = new AscentRoutes(db);
    const avatarRoutes = new AvatarRoutes();
    const gpxRoutes = new GpxRoutes(db);
    const listRoutes = new ListRoutes(db);
    const mountainRoutes = new MountainRoutes(db);
    const userRoutes = new UserRoutes(db);

    this.router = express.Router();
    this.router.use(logApiRequest);
    this.router.use(activityRoutes.router);
    this.router.use(ascentRoutes.router);
    this.router.use(avatarRoutes.router);
    this.router.use(gpxRoutes.router);
    this.router.use(listRoutes.router);
    this.router.use(mountainRoutes.router);
    this.router.use(userRoutes.router);
  }
}
