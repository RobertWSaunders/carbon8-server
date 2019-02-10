const Router = require("express").Router;

const { sendError, ValidationError } = require("../../errors");

// Request Validation Methods

function validateFountainCreate(name, sparklingSupported, needsMaintenance) {
  if (!name) {
    return Promise.reject(
      new ValidationError(
        "The request does not have all the required fields! Please make sure to supply a name, needsMaintenance, and sparklingSupported in the request body."
      )
    );
  }

  return Promise.resolve();
}

// Route Implementation

module.exports = (db) => {
  const fountainApi = Router();

  const fountainCtr = require("../controllers/fountain.controller")(db);

  fountainApi.get("/", async (req, res) => {
    try {
      const { fountains } = await fountainCtr.getAllFountains();

      return res.status(200).json({
        fountains
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  fountainApi.post("/", async (req, res) => {
    try {
      const { name, sparklingSupported, needsMaintenance } = req.body;

      await validateFountainCreate(name, needsMaintenance, sparklingSupported);

      const { fountain } = await fountainCtr.createFountain(req.body);

      return res.status(200).json({
        fountain
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  fountainApi.get("/:fountainId", async (req, res) => {
    try {
      const { fountainId } = req.params;

      const { fountain } = await fountainCtr.getFountainById(fountainId);

      return res.status(200).json({
        fountain
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  fountainApi.put("/:fountainId", async (req, res) => {
    try {
      const { fountainId } = req.params;

      const { fountain } = await fountainCtr.updateFountainById(
        fountainId,
        req.body
      );

      return res.status(200).json({
        fountain
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  return fountainApi;
};
