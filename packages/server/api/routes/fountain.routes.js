const Router = require("express").Router;

module.exports = (db) => {
  const fountainApi = Router();

  const fountainCtr = require("../controllers/fountain.controller")(db);

  // get a list of fountains

  fountainApi.get("/", (req, res) => {});

  // get a specific fountain by id

  fountainApi.get("/:fountainId", (req, res) => {});

  return fountainApi;
};
