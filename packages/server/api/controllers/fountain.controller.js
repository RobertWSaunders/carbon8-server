const { RestApiError, NotFoundError } = require("../../errors");

module.exports = (db) => {
  async function getFountainStatistics(fountainId) {
    try {
      const flatWaterIntakes = await db.UserWaterIntake.findAll({
        attributes: [
          [
            db.sequelize.fn("SUM", db.sequelize.col("intakeAmount")),
            "intakeAmount"
          ]
        ],
        where: {
          fountainId,
          intakeWaterType: "FLAT"
        }
      });

      const sparklingWaterIntakes = await db.UserWaterIntake.findAll({
        where: {
          fountainId,
          intakeWaterType: "SPARKLING"
        }
      });
    } catch (err) {}
  }

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
      const fountain = await db.Fountain.findByPk(fountainId);

      await getFountainStatistics(fountain.id);

      const fountainWithStats = Object.assign(
        {
          flatWaterDispensed: "30 L",
          plasticBottlesSaved: "29201",
          sparklingWaterDispensed: "10 L"
        },
        fountain.dataValues
      );

      return Promise.resolve({
        fountain: fountainWithStats
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
