const sequelize = require("../config/database");
const migrator = require("./migrator");

const action = process.argv[2] || "up";

const run = async () => {
  try {
    await sequelize.authenticate();

    if (action === "up") {
      const migrations = await migrator.up();
      console.log(
        "Applied migrations:",
        migrations.map((m) => m.name),
      );
    } else if (action === "down") {
      const reverted = await migrator.down();
      console.log("Reverted migration:", reverted ? reverted.name : "none");
    } else if (action === "status") {
      const [executed, pending] = await Promise.all([
        migrator.executed(),
        migrator.pending(),
      ]);
      console.log(
        "Executed:",
        executed.map((m) => m.name),
      );
      console.log(
        "Pending:",
        pending.map((m) => m.name),
      );
    } else {
      console.log("Unknown action. Use up|down|status");
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
