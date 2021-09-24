import "./model";
import ClientService from "./services/client";
import gpx from "./middleware/gpx";

import express from "express";

import { Logger } from "tslog";

const logger: Logger = new Logger();

class Server {
  #app: express.Application;
  #port: number;

  #clientService: ClientService;

  constructor() {
    this.#app = express();
    this.#port = parseInt(process.env.PORT, 10);

    this.#clientService = new ClientService();

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.#app.use(express.json());
    this.#app.use(gpx);
  }

  // Bind controllers to routes
  routes() {
    this.#app.use("/api/client", this.#clientService.router);
  }

  listen() {
    this.#app.listen(this.#port, () => {
      logger.info("Server running on port: ", this.#port);
    });
  }
}

export { Server };
