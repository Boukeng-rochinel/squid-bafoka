const express = require("express");
const cors = require("cors");

class ExpressServer {
  constructor(port = 3000) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  addRoutes(routes) {
    routes.forEach((route) => {
      this.app[route.method](route.path, route.handler);
    });
  }

  setupRoutes(router) {
    this.app.use("/", router);
    console.log("✅ Routes connectées au serveur Express.");
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Serveur Express démarré sur le port ${this.port}`);
        resolve();
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log("Serveur Express arrêté");
          resolve();
        });
      });
    }
  }
}

module.exports = ExpressServer;
