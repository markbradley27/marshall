import path from "node:path";

import express from "express";
import admin from "firebase-admin";
import { Logger } from "tslog";
import { DataSource } from "typeorm";

import { JSON_MIDDLEWARE_SIZE_LIMIT } from "./consts";
import gpx from "./middleware/gpx";
import { ClientService } from "./services/client/client_service";
import StravaService from "./services/strava";

const logger: Logger = new Logger();

class Server {
  #app: express.Application;
  #port: number;

  #db: DataSource;

  #stravaService: StravaService;
  #clientService: ClientService;

  constructor(db: DataSource) {
    this.#app = express();
    this.#port = parseInt(process.env.PORT, 10);
    this.#db = db;

    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });

    this.#clientService = new ClientService(this.#db);
    this.#stravaService = new StravaService(
      parseInt(process.env.STRAVA_CLIENT_ID, 10),
      process.env.STRAVA_CLIENT_SECRET,
      this.#db
    );

    this.middlewares();
    this.routes();

    this.#stravaService.subscribe();
  }

  middlewares() {
    this.#app.use(express.json({ limit: JSON_MIDDLEWARE_SIZE_LIMIT }));
    this.#app.use(gpx);
  }

  // Bind controllers to routes
  routes() {
    const reactBuildDir = path.join(process.cwd(), "app/build");
    this.#app.use(express.static(reactBuildDir));

    this.#app.use("/api/client", this.#clientService.router);
    this.#app.use("/api/strava", this.#stravaService.router);

    this.#app.get("*", (_req, res) => {
      res.sendFile(path.join(reactBuildDir, "index.html"));
    });
  }

  listen() {
    this.#app.listen(this.#port, () => {
      logger.info("Server running on port: ", this.#port);
    });
  }
}

export { Server };
