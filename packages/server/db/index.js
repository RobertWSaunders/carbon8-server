const Sequelize = require("sequelize");

const logger = require("../utils/logger");
const config = require("./config");

const db_env = process.env.DB_ENVIRONMENT || "development";
const db_config = config[db_env];

const database = async () => {
  const sequelize = new Sequelize(db_config);

  await sequelize.authenticate();

  logger.info("Successfully authenticated with the database!");

  const db = {
    User: sequelize.import("./models/user"),
    Fountain: sequelize.import("./models/fountain"),
    HydrationGoal: sequelize.import("./models/hydration-goal"),
    UserWaterIntake: sequelize.import("./models/user-water-intake")
  };

  Object.keys(db).forEach((modelName) => {
    if ("associate" in db[modelName]) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
};

module.exports = database;
