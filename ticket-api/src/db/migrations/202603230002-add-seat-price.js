const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface) => {
    const ensureColumn = async (tableName, columnName, definition) => {
      try {
        const table = await queryInterface.describeTable(tableName);
        if (!table[columnName]) {
          await queryInterface.addColumn(tableName, columnName, definition);
        }
      } catch (error) {
        if (error?.original?.code !== "ER_NO_SUCH_TABLE") {
          throw error;
        }
      }
    };

    await ensureColumn("seats", "price", {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: "Custom price for this seat. If null, uses showtime base price",
    });
  },

  down: async (queryInterface) => {
    const dropColumnIfExists = async (tableName, columnName) => {
      try {
        const table = await queryInterface.describeTable(tableName);
        if (table[columnName]) {
          await queryInterface.removeColumn(tableName, columnName);
        }
      } catch (error) {
        // Table missing, ignore
      }
    };

    await dropColumnIfExists("seats", "price");
  },
};
