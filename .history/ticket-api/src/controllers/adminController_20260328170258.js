const { Op } = require("sequelize");
const dayjs = require("dayjs");
const {
  sequelize,
  User,
  Movie,
  Cinema,
  Room,
  Seat,
  Showtime,
  Booking,
  SeatReservation,
  Payment,
} = require("../models");
const ApiError = require("../utils/apiError");
const { cancelBooking } = require("../services/bookingService");

const listUsers = async (req, res) => {
  const rows = await User.findAll({
    attributes: [
      "id",
      "fullName",
      "email",
      "phone",
      "role",
      "isLocked",
      "createdAt",
    ],
    raw: true,
    order: [["createdAt", "DESC"]],
  });
  return res.json({ message: "Users fetched successfully.", data: rows });
};

const lockUser = async (req, res) => {
  const row = await User.findByPk(req.params.id);
  if (!row) {
    throw new ApiError(404, "Không tìm thấy tài khoản.");
  }
  row.isLocked = Boolean(req.body.isLocked);
  await row.save();
  return res.json({ message: "User status updated.", data: row });
};

const createMovie = async (req, res) => {
  const payload = req.body;
  const posterFile = req.files?.poster?.[0];
  const trailerFile = req.files?.trailer?.[0];

  if (posterFile) {
    payload.posterUrl = `/uploads/${posterFile.filename}`;
  }
  if (trailerFile) {
    payload.trailerUrl = `/uploads/${trailerFile.filename}`;
  }
  const movie = await Movie.create(payload);
  return res.status(201).json({ message: "Movie created.", data: movie });
};

const updateMovie = async (req, res) => {
  const row = await Movie.findByPk(req.params.id);
  if (!row) {
    throw new ApiError(404, "Không tìm thấy phim.");
  }

  Object.assign(row, req.body);
  const posterFile = req.files?.poster?.[0];
  const trailerFile = req.files?.trailer?.[0];

  if (posterFile) {
    row.posterUrl = `/uploads/${posterFile.filename}`;
  }
  if (trailerFile) {
    row.trailerUrl = `/uploads/${trailerFile.filename}`;
  }

  await row.save();
  return res.json({ message: "Movie updated.", data: row });
};

const deleteMovie = async (req, res) => {
  const row = await Movie.findByPk(req.params.id);
  if (!row) {
    throw new ApiError(404, "Không tìm thấy phim.");
  }
  await row.destroy();
  return res.json({ message: "Movie deleted." });
};

const listMoviesAdmin = async (req, res) => {
  const rows = await Movie.findAll({ order: [["createdAt", "DESC"]] });
  return res.json({ data: rows });
};

const createCinema = async (req, res) => {
  const row = await Cinema.create(req.body);
  return res.status(201).json({ message: "Cinema created.", data: row });
};

const listCinemas = async (req, res) => {
  const rows = await Cinema.findAll({
    include: [{ model: Room }],
    order: [["createdAt", "DESC"]],
  });
  return res.json({ data: rows });
};

const createRoom = async (req, res) => {
  const row = await Room.create(req.body);
  return res.status(201).json({ message: "Room created.", data: row });
};

const listRooms = async (req, res) => {
  const rows = await Room.findAll({
    include: [{ model: Cinema }],
    order: [["createdAt", "DESC"]],
  });
  return res.json({ data: rows });
};

const configureSeats = async (req, res) => {
  const room = await Room.findByPk(req.params.roomId);
  if (!room) {
    throw new ApiError(404, "Không tìm thấy phòng.");
  }

  const { seats } = req.body;
  if (!Array.isArray(seats) || seats.length === 0) {
    throw new ApiError(400, "Vui lòng chọn ghế.");
  }

  await sequelize.transaction(async (transaction) => {
    await Seat.destroy({ where: { roomId: room.id }, transaction });
    await Seat.bulkCreate(
      seats.map((item) => ({
        roomId: room.id,
        rowLabel: item.rowLabel,
        seatNumber: item.seatNumber,
        type: item.type || "SINGLE",
        isActive: item.isActive !== false,
      })),
      { transaction },
    );
  });

  return res.json({ message: "Seat layout updated." });
};

const hasRoomTimeConflict = async ({
  roomId,
  startTime,
  endTime,
  excludeShowtimeId = null,
}) => {
  const where = {
    roomId,
    status: "ACTIVE",
    [Op.and]: [
      { startTime: { [Op.lt]: endTime } },
      { endTime: { [Op.gt]: startTime } },
    ],
  };

  if (excludeShowtimeId) {
    where.id = { [Op.ne]: excludeShowtimeId };
  }

  const conflict = await Showtime.findOne({ where });
  return Boolean(conflict);
};

const createShowtime = async (req, res) => {
  const payload = req.body;
  if (dayjs(payload.endTime).isBefore(dayjs(payload.startTime))) {
    throw new ApiError(400, "endTime must be after startTime.");
  }

  const conflict = await hasRoomTimeConflict({
    roomId: payload.roomId,
    startTime: payload.startTime,
    endTime: payload.endTime,
  });

  if (conflict) {
    throw new ApiError(409, "Room schedule conflicts with existing showtime.");
  }

  const row = await Showtime.create(payload);
  return res.status(201).json({ message: "Showtime created.", data: row });
};

const updateShowtime = async (req, res) => {
  const row = await Showtime.findByPk(req.params.id);
  if (!row) {
    throw new ApiError(404, "Showtime not found.");
  }

  const startTime = req.body.startTime || row.startTime;
  const endTime = req.body.endTime || row.endTime;
  const roomId = req.body.roomId || row.roomId;

  const conflict = await hasRoomTimeConflict({
    roomId,
    startTime,
    endTime,
    excludeShowtimeId: row.id,
  });

  if (conflict) {
    throw new ApiError(409, "Room schedule conflicts with existing showtime.");
  }

  Object.assign(row, req.body);
  await row.save();
  return res.json({ message: "Showtime updated.", data: row });
};

const deleteShowtime = async (req, res) => {
  const row = await Showtime.findByPk(req.params.id);
  if (!row) {
    throw new ApiError(404, "Showtime not found.");
  }
  await row.destroy();
  return res.json({ message: "Showtime deleted." });
};

const listShowtimesAdmin = async (req, res) => {
  const rows = await Showtime.findAll({
    include: [Movie, Room],
    order: [["startTime", "DESC"]],
  });
  return res.json({ data: rows });
};

const listBookingsAdmin = async (req, res) => {
  const rows = await Booking.findAll({
    include: [
      { model: User, attributes: ["id", "fullName", "email"] },
      { model: Showtime, include: [Movie, Room] },
      { model: SeatReservation, include: [Seat] },
    ],
    order: [["createdAt", "DESC"]],
  });
  return res.json({ data: rows });
};

const confirmBookingAdmin = async (req, res) => {
  const row = await Booking.findByPk(req.params.id);
  if (!row) {
    throw new ApiError(404, "Booking not found.");
  }

  row.status = "CONFIRMED";
  row.paymentStatus =
    row.paymentStatus === "PENDING" ? "PAID" : row.paymentStatus;
  row.expiresAt = null;
  await row.save();

  await SeatReservation.update(
    { status: "BOOKED", expiresAt: null },
    { where: { bookingId: row.id, status: { [Op.in]: ["HELD", "BOOKED"] } } },
  );

  if (row.paymentStatus === "PAID") {
    const exists = await Payment.findOne({ where: { bookingId: row.id } });
    if (!exists) {
      await Payment.create({
        bookingId: row.id,
        method: "ADMIN",
        status: "SUCCESS",
        transactionRef: `ADMIN-${Date.now()}`,
        paidAt: new Date(),
        amount: row.totalAmount,
      });
    }
  }

  return res.json({ message: "Booking confirmed.", data: row });
};

const cancelBookingAdmin = async (req, res) => {
  const row = await cancelBooking({
    bookingId: Number(req.params.id),
    userId: null,
    isAdmin: true,
  });
  return res.json({ message: "Booking canceled.", data: row });
};

const dashboard = async (req, res) => {
  const totalTicketsSold = await SeatReservation.count({
    where: { status: "BOOKED" },
  });

  const revenueResult = await Payment.findAll({
    where: { status: "SUCCESS" },
    attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "revenue"]],
  });

  const popularShowtimes = await SeatReservation.findAll({
    attributes: [
      "showtimeId",
      [sequelize.fn("COUNT", sequelize.col("SeatReservation.id")), "seatCount"],
    ],
    where: { status: "BOOKED" },
    group: ["showtimeId"],
    order: [[sequelize.literal("seatCount"), "DESC"]],
    limit: 5,
    include: [{ model: Showtime, include: [Movie, Room] }],
  });

  return res.json({
    data: {
      totalTicketsSold,
      revenue: Number(revenueResult[0]?.get("revenue") || 0),
      popularShowtimes,
    },
  });
};

module.exports = {
  listUsers,
  lockUser,
  createMovie,
  updateMovie,
  deleteMovie,
  listMoviesAdmin,
  createCinema,
  listCinemas,
  createRoom,
  listRooms,
  configureSeats,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  listShowtimesAdmin,
  listBookingsAdmin,
  confirmBookingAdmin,
  cancelBookingAdmin,
  dashboard,
};
