import express from "express";
import admin from "firebase-admin";
import { Logger } from "tslog";

import gpx from "./middleware/gpx";
import "./model";
import ClientService from "./services/client";
import StravaService from "./services/strava";

const logger: Logger = new Logger();

class Server {
  #app: express.Application;
  #port: number;

  #stravaService: StravaService;
  #clientService: ClientService;

  constructor() {
    this.#app = express();
    this.#port = parseInt(process.env.PORT, 10);

    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });

    this.#clientService = new ClientService();
    this.#stravaService = new StravaService(
      parseInt(process.env.STRAVA_CLIENT_ID, 10),
      process.env.STRAVA_CLIENT_SECRET
    );

    this.middlewares();
    this.routes();

    this.#stravaService.subscribe();
  }

  middlewares() {
    this.#app.use(express.json());
    this.#app.use(gpx);
  }

  // Bind controllers to routes
  routes() {
    this.#app.use("/api/client", this.#clientService.router);
    this.#app.use("/api/strava", this.#stravaService.router);
  }

  listen() {
    this.#app.listen(this.#port, () => {
      logger.info("Server running on port: ", this.#port);
    });
  }
}

export { Server };
