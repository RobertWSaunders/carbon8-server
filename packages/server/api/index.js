const Router = require("express").Router;

const fountainRoutes = require("./routes/fountain.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

module.exports = (db) => {
  const api = Router();

  const { requestAuthMiddleware } = require("../auth")(db);

  // auth routes
  api.use("/auth/", authRoutes(db));

  // user routes
  api.use("/users/", requestAuthMiddleware(), userRoutes(db));

  // fountain routes
  api.use("/fountains/", fountainRoutes(db));

  return api;
};
