const options = {
  operatorsAliases: false,
  port: process.env.DB_PORT || 5432,
  define: {
    underscored: false,
    timestamps: true,
    freezeTableName: true
  }
};

const config = {
  development: {
    database: "carbon8-dev-database",
    host: "localhost",
    dialect: "postgres",
    ...options
  },
  production: {
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: "postgres",
    logging: false,
    ...options
  }
};

module.exports = config;
