const app = require("./app");
const env = require("./config/env");
const sequelize = require("./config/database");
const { seedDefaults } = require("./services/bootstrapService");

const startServer = async () => {
  try {
    await sequelize.authenticate();
    if (env.dbSyncOnStart) {
      await sequelize.sync();
    }
    await seedDefaults();

    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running at http://localhost:${env.port}`);
      // eslint-disable-next-line no-console
      console.log(`Swagger docs: http://localhost:${env.port}/api-docs`);
      // eslint-disable-next-line no-console
      console.log("Default admin: admin@gmail.com / admin123");
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
