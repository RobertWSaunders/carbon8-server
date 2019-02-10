const { RestApiError, NotFoundError } = require("../../errors");

module.exports = (db) => {
  async function getAllFountains() {
    try {
      const fountains = await db.Fountain.findAll();

      return Promise.resolve({
        fountains
      });
    } catch (err) {
      return Promise.reject(new RestApiError());
    }
  }

  async function createFountain(data) {
    try {
      const fountain = await db.Fountain.create(data);

      return Promise.resolve({
        fountain
      });
    } catch (err) {
      return Promise.reject(new RestApiError());
    }
  }

  async function getFountainById(fountainId) {
    try {
      const fountain = await db.Fountain.findById(fountainId);

      return Promise.resolve({
        fountain
      });
    } catch (err) {
      return Promise.reject(new RestApiError());
    }
  }

  async function updateFountainById(fountainId, data) {
    try {
      const fountain = await db.Fountain.findById(fountainId);

      await fountain.update(data);

      return Promise.resolve({
        fountain
      });
    } catch (err) {
      return Promise.reject(new RestApiError());
    }
  }

  return {
    getAllFountains,
    createFountain,
    getFountainById,
    updateFountainById
  };
};
