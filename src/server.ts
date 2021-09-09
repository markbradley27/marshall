import "./model/model";
import express from "express";
import { Logger } from "tslog";

const logger: Logger = new Logger();

class Server {
  #app: express.Application;
  #port: number;

  constructor() {
    this.#app = express();
    this.#port = parseInt(process.env.PORT, 10);

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.#app.use(express.json());
  }

  // Bind controllers to routes
  routes() {
    // pass
  }

  listen() {
    this.#app.listen(this.#port, () => {
      logger.info("Server running on port: ", this.#port);
    });
  }
}

export { Server };
