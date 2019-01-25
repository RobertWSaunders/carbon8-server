require("dotenv").config();

const compression = require("compression");
const bodyParser = require("body-parser");
const logger = require("./utils/logger");
const express = require("express");
const helmet = require("helmet");
const http = require("http");
const cors = require("cors");
const db = require("./db");

const IS_PROD = process.env.NODE_ENV === "production";
const FORCE_SSL = process.env.FORCE_SSL === "true";

IS_PROD
  ? logger.info("Running production server!")
  : logger.info("Running development server!");

db()
  .then(async (db) => {
    // Syncrhonize database
    // db.sequelize.sync({ force: true });

    // Express server
    const app = express();
    const port = process.env.PORT || 3001;

    // HTTP server
    const server = http.createServer(app);

    // Third party middleware
    app.use(cors());
    app.use(helmet());
    app.use(compression());
    app.use(bodyParser.json({ limit: "10mb" }));
    app.use(bodyParser.urlencoded({ extended: true }));

    // Auth API
    const { authApi } = require("./auth")(db);

    // Auth endpoints
    app.use("/auth/", authApi());

    // Socket.IO setup
    const io = require("socket.io")(server, {
      path: "/socket",
      serveClient: false,
      transports: ["websocket"]
    });

    // Configure socket handlers
    require("./socket")(io, logger, db);

    // HTTPS redirect
    if (IS_PROD) {
      if (FORCE_SSL) {
        app.enable("trust proxy");
        app.use((req, res, next) => {
          if (req.secure) {
            next();
          } else {
            res.redirect(`https://${req.headers.host}${req.url}`);
          }
        });
      }
    }

    // Start listening!
    server.listen(port, () => {
      logger.info(`Carbon8 server is running on port ${port}!`);
    });
  })
  .catch((err) => {
    logger.error("Error! Cannot start server.", err);
  });
