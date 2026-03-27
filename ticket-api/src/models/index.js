const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fullName: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    avatarUrl: { type: DataTypes.STRING(255), allowNull: true },
    role: {
      type: DataTypes.ENUM("USER", "ADMIN"),
      allowNull: false,
      defaultValue: "USER",
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  { tableName: "users", timestamps: true },
);

const Cinema = sequelize.define(
  "Cinema",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: false },
  },
  { tableName: "cinemas", timestamps: true },
);

const Room = sequelize.define(
  "Room",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    cinemaId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(80), allowNull: false },
    rowCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    colCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
  },
  { tableName: "rooms", timestamps: true },
);

const Seat = sequelize.define(
  "Seat",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    roomId: { type: DataTypes.INTEGER, allowNull: false },
    rowLabel: { type: DataTypes.STRING(4), allowNull: false },
    seatNumber: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM("SINGLE", "COUPLE"),
      allowNull: false,
      defaultValue: "SINGLE",
    },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "seats",
    timestamps: true,
    indexes: [{ unique: true, fields: ["roomId", "rowLabel", "seatNumber"] }],
  },
);

const Movie = sequelize.define(
  "Movie",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    trailerUrl: { type: DataTypes.STRING(255), allowNull: true },
    posterUrl: { type: DataTypes.STRING(255), allowNull: true },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: false },
    releaseDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM("NOW_SHOWING", "COMING_SOON"),
      allowNull: false,
      defaultValue: "COMING_SOON",
    },
  },
  { tableName: "movies", timestamps: true },
);

const Showtime = sequelize.define(
  "Showtime",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    movieId: { type: DataTypes.INTEGER, allowNull: false },
    roomId: { type: DataTypes.INTEGER, allowNull: false },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
    basePrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 90000,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  { tableName: "showtimes", timestamps: true },
);

const Snack = sequelize.define(
  "Snack",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "snacks", timestamps: true },
);

const Booking = sequelize.define(
  "Booking",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    showtimeId: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("HOLD", "CONFIRMED", "CANCELED", "EXPIRED"),
      allowNull: false,
      defaultValue: "HOLD",
    },
    paymentStatus: {
      type: DataTypes.ENUM("PENDING", "PAID", "FAILED", "REFUNDED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "bookings", timestamps: true },
);

const SeatReservation = sequelize.define(
  "SeatReservation",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    showtimeId: { type: DataTypes.INTEGER, allowNull: false },
    seatId: { type: DataTypes.INTEGER, allowNull: false },
    bookingId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("HELD", "BOOKED", "EXPIRED", "CANCELED"),
      allowNull: false,
      defaultValue: "HELD",
    },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  {
    tableName: "seat_reservations",
    timestamps: true,
    indexes: [{ unique: true, fields: ["showtimeId", "seatId"] }],
  },
);

const BookingSnack = sequelize.define(
  "BookingSnack",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bookingId: { type: DataTypes.INTEGER, allowNull: false },
    snackId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  { tableName: "booking_snacks", timestamps: true },
);

const Payment = sequelize.define(
  "Payment",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bookingId: { type: DataTypes.INTEGER, allowNull: false },
    method: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "DEMO",
    },
    status: {
      type: DataTypes.ENUM("SUCCESS", "FAILED"),
      allowNull: false,
      defaultValue: "SUCCESS",
    },
    transactionRef: { type: DataTypes.STRING(80), allowNull: false },
    paidAt: { type: DataTypes.DATE, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  { tableName: "payments", timestamps: true },
);

const Ticket = sequelize.define(
  "Ticket",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bookingId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    ticketCode: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    qrCodeData: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM("VALID", "USED", "CANCELED"),
      allowNull: false,
      defaultValue: "VALID",
    },
  },
  { tableName: "tickets", timestamps: true },
);

Cinema.hasMany(Room, { foreignKey: "cinemaId" });
Room.belongsTo(Cinema, { foreignKey: "cinemaId" });

Room.hasMany(Seat, { foreignKey: "roomId" });
Seat.belongsTo(Room, { foreignKey: "roomId" });

Movie.hasMany(Showtime, { foreignKey: "movieId" });
Showtime.belongsTo(Movie, { foreignKey: "movieId" });

Room.hasMany(Showtime, { foreignKey: "roomId" });
Showtime.belongsTo(Room, { foreignKey: "roomId" });

User.hasMany(Booking, { foreignKey: "userId" });
Booking.belongsTo(User, { foreignKey: "userId" });

Showtime.hasMany(Booking, { foreignKey: "showtimeId" });
Booking.belongsTo(Showtime, { foreignKey: "showtimeId" });

Booking.hasMany(SeatReservation, { foreignKey: "bookingId" });
SeatReservation.belongsTo(Booking, { foreignKey: "bookingId" });

Showtime.hasMany(SeatReservation, { foreignKey: "showtimeId" });
SeatReservation.belongsTo(Showtime, { foreignKey: "showtimeId" });

Seat.hasMany(SeatReservation, { foreignKey: "seatId" });
SeatReservation.belongsTo(Seat, { foreignKey: "seatId" });

Booking.hasMany(BookingSnack, { foreignKey: "bookingId" });
BookingSnack.belongsTo(Booking, { foreignKey: "bookingId" });

Snack.hasMany(BookingSnack, { foreignKey: "snackId" });
BookingSnack.belongsTo(Snack, { foreignKey: "snackId" });

Booking.hasMany(Payment, { foreignKey: "bookingId" });
Payment.belongsTo(Booking, { foreignKey: "bookingId" });

Booking.hasOne(Ticket, { foreignKey: "bookingId" });
Ticket.belongsTo(Booking, { foreignKey: "bookingId" });

module.exports = {
  sequelize,
  User,
  Cinema,
  Room,
  Seat,
  Movie,
  Showtime,
  Snack,
  Booking,
  SeatReservation,
  BookingSnack,
  Payment,
  Ticket,
};
