const path = require("path");
const { Umzug, SequelizeStorage } = require("umzug");
const sequelize = require("../config/database");

const migrator = new Umzug({
  migrations: {
    glob: ["migrations/*.js", { cwd: __dirname }],
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, modelName: "migrations_meta" }),
  logger: console,
});

module.exports = migrator;
