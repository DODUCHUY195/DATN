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
        // Skip when table does not exist yet. Initial schema can still be created by sync on first run.
      }
    };

    await ensureColumn("users", "avatarUrl", {
      type: DataTypes.STRING(255),
      allowNull: true,
    });

    await ensureColumn("movies", "trailerUrl", {
      type: DataTypes.STRING(255),
      allowNull: true,
    });

    await ensureColumn("movies", "posterUrl", {
      type: DataTypes.STRING(255),
      allowNull: true,
    });

    await ensureColumn("movies", "releaseDate", {
      type: DataTypes.DATEONLY,
      allowNull: true,
    });

    await ensureColumn("movies", "status", {
      type: DataTypes.ENUM("NOW_SHOWING", "COMING_SOON"),
      allowNull: false,
      defaultValue: "COMING_SOON",
    });

    await ensureColumn("rooms", "rowCount", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    });

    await ensureColumn("rooms", "colCount", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12,
    });

    await ensureColumn("bookings", "expiresAt", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await ensureColumn("bookings", "paymentStatus", {
      type: DataTypes.ENUM("PENDING", "PAID", "FAILED", "REFUNDED"),
      allowNull: false,
      defaultValue: "PENDING",
    });

    await ensureColumn("seat_reservations", "expiresAt", {
      type: DataTypes.DATE,
      allowNull: true,
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
        // Table missing, ignore.
      }
    };

    await dropColumnIfExists("seat_reservations", "expiresAt");
    await dropColumnIfExists("bookings", "paymentStatus");
    await dropColumnIfExists("bookings", "expiresAt");
    await dropColumnIfExists("rooms", "colCount");
    await dropColumnIfExists("rooms", "rowCount");
    await dropColumnIfExists("movies", "status");
    await dropColumnIfExists("movies", "releaseDate");
    await dropColumnIfExists("movies", "posterUrl");
    await dropColumnIfExists("movies", "trailerUrl");
    await dropColumnIfExists("users", "avatarUrl");
  },
};
