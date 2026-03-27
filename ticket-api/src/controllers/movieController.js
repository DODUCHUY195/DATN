const { Op, where, fn, col } = require("sequelize");
const dayjs = require("dayjs");
const {
  Movie,
  Showtime,
  Room,
  Cinema,
  Seat,
  SeatReservation,
  Snack,
} = require("../models");

const listMovies = async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status) {
    where.status = status;
  }

  const rows = await Movie.findAll({ where, order: [["releaseDate", "DESC"]] });
  return res.json({ data: rows });
};

const getMovieDetail = async (req, res) => {
  const movie = await Movie.findByPk(req.params.id);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found." });
  }
  return res.json({ data: movie });
};

const listShowtimes = async (req, res) => {
  const { date, roomId, timeSlot, movieId } = req.query;
  const where = { status: "ACTIVE" };

  if (roomId) {
    where.roomId = roomId;
  }

  if (movieId) {
    where.movieId = movieId;
  }

  if (date) {
    const start = dayjs(date).startOf("day").toDate();
    const end = dayjs(date).endOf("day").toDate();
    where.startTime = { [Op.between]: [start, end] };
  }

  if (timeSlot) {
    const [from, to] = timeSlot.split("-").map((n) => Number(n));
    if (!Number.isNaN(from) && !Number.isNaN(to)) {
      where[Op.and] = [
        where(fn("HOUR", col("startTime")), { [Op.gte]: from }),
        where(fn("HOUR", col("startTime")), { [Op.lt]: to }),
      ];
    }
  }

  const rows = await Showtime.findAll({
    where,
    include: [{ model: Movie }, { model: Room, include: [{ model: Cinema }] }],
    order: [["startTime", "ASC"]],
  });

  return res.json({ data: rows });
};

const getSeatMapByShowtime = async (req, res) => {
  const showtime = await Showtime.findByPk(req.params.id);
  if (!showtime) {
    return res.status(404).json({ message: "Showtime not found." });
  }

  const seats = await Seat.findAll({
    where: {
      roomId: showtime.roomId,
      isActive: true,
    },
    order: [
      ["rowLabel", "ASC"],
      ["seatNumber", "ASC"],
    ],
  });

  const now = new Date();
  const reservations = await SeatReservation.findAll({
    where: {
      showtimeId: showtime.id,
      [Op.or]: [
        { status: "BOOKED" },
        { status: "HELD", expiresAt: { [Op.gt]: now } },
      ],
    },
  });

  const map = seats.map((seat) => {
    const reservation = reservations.find((r) => r.seatId === seat.id);
    return {
      id: seat.id,
      rowLabel: seat.rowLabel,
      seatNumber: seat.seatNumber,
      type: seat.type,
      status: reservation
        ? reservation.status === "BOOKED"
          ? "BOOKED"
          : "HELD"
        : "AVAILABLE",
    };
  });

  return res.json({ data: map });
};

const listSnacks = async (req, res) => {
  const rows = await Snack.findAll({
    where: { isActive: true },
    order: [["name", "ASC"]],
  });

  return res.json({ data: rows });
};

module.exports = {
  listMovies,
  getMovieDetail,
  listShowtimes,
  getSeatMapByShowtime,
  listSnacks,
};
