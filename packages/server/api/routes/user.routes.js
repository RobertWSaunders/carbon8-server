const Router = require("express").Router;

module.exports = (db) => {
  const userApi = Router();

  const userCtr = require("../controllers/user.controller")(db);

  // gets a specific user by id

  userApi.get("/:userId", (req, res) => {});

  // updates a specific user by id

  userApi.put("/:userId", (req, res) => {});

  // get list of user intakes, can pass filter arguments in query string

  userApi.get("/:userId/intakes", (req, res) => {});

  // gets a specific intake by id

  userApi.get("/:userId/intakes/:intakeId", (req, res) => {});

  // update a specfic intake

  userApi.put("/:userId/intakes/:intakeId", (req, res) => {});

  // creates a new intake log

  userApi.post("/:userId/intakes", (req, res) => {});

  // get a list of the users hydrations goals

  userApi.get("/:userId/goals", (req, res) => {});

  // get a user hydration goal by id

  userApi.get("/:userId/goals/:goalId", (req, res) => {});

  // update a specfic goal

  userApi.put("/:userId/goals/:goalId", (req, res) => {});

  // create a user hydration goal

  userApi.post("/:userId/goals", (req, res) => {});

  return userApi;
};
