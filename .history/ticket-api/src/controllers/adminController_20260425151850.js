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
    throw new ApiError(404, "User not found.");
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
    throw new ApiError(404, "Movie not found.");
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
    throw new ApiError(404, "Movie not found.");
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
  const { rowCount, colCount } = req.body;

  const row = await sequelize.transaction(async (transaction) => {
    const room = await Room.create(req.body, { transaction });

    const seats = [];
    for (let r = 0; r < rowCount; r++) {
      const rowLabel = String.fromCharCode(65 + r); // A, B, C, ...
      for (let c = 1; c <= colCount; c++) {
        seats.push({
          roomId: room.id,
          rowLabel,
          seatNumber: c,
          type: "SINGLE",
          isActive: true,
        });
      }
    }
    await Seat.bulkCreate(seats, { transaction });

    return room;
  });

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
    throw new ApiError(404, "Room not found.");
  }

  const { seats } = req.body;
  if (!Array.isArray(seats) || seats.length === 0) {
    throw new ApiError(400, "seats array is required.");
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

const GOLDEN_HOUR_START = 18;
const GOLDEN_HOUR_END = 22;

const sumBy = (rows, key) =>
  rows.reduce((total, item) => total + Number(item[key] || 0), 0);

const getDashboardRange = (query) => {
  const now = dayjs();
  const dateFrom = query.dateFrom
    ? dayjs(query.dateFrom)
    : now.startOf("month");
  const dateTo = query.dateTo ? dayjs(query.dateTo) : now.endOf("month");

  if (!dateFrom.isValid() || !dateTo.isValid() || dateFrom.isAfter(dateTo)) {
    throw new ApiError(400, "Invalid dateFrom/dateTo range.");
  }

  return {
    from: dateFrom.startOf("day").toDate(),
    to: dateTo.endOf("day").toDate(),
  };
};

const getRevenueOverview = async () => {
  const [todayRevenueRows, weekRevenueRows, monthRevenueRows] =
    await Promise.all([
      Payment.findAll({
        where: {
          status: "SUCCESS",
          paidAt: { [Op.gte]: dayjs().startOf("day").toDate() },
        },
        attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total"]],
        raw: true,
      }),
      Payment.findAll({
        where: {
          status: "SUCCESS",
          paidAt: { [Op.gte]: dayjs().startOf("week").toDate() },
        },
        attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total"]],
        raw: true,
      }),
      Payment.findAll({
        where: {
          status: "SUCCESS",
          paidAt: { [Op.gte]: dayjs().startOf("month").toDate() },
        },
        attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total"]],
        raw: true,
      }),
    ]);

  return {
    daily: Number(todayRevenueRows[0]?.total || 0),
    weekly: Number(weekRevenueRows[0]?.total || 0),
    monthly: Number(monthRevenueRows[0]?.total || 0),
  };
};

const dashboard = async (req, res) => {
  const { from, to } = getDashboardRange(req.query);

  const [
    paymentRows,
    reservationRows,
    roomCapacityRows,
    movieStatusRows,
    dailyShowtimeRows,
    canceledShowtimeCount,
    revenueOverview,
  ] = await Promise.all([
    Payment.findAll({
      where: {
        status: "SUCCESS",
      },
      include: [
        {
          model: Booking,
          attributes: ["id", "showtimeId"],
          include: [
            {
              model: Showtime,
              attributes: ["id", "movieId", "roomId", "startTime"],
              include: [
                { model: Movie, attributes: ["id", "title"] },
                {
                  model: Room,
                  attributes: ["id", "name", "cinemaId"],
                  include: [{ model: Cinema, attributes: ["id", "name"] }],
                },
              ],
            },
          ],
        },
      ],
      raw: false,
    }),
    SeatReservation.findAll({
      where: {
        createdAt: { [Op.between]: [from, to] },
      },
      include: [
        {
          model: Showtime,
          attributes: ["id", "movieId", "roomId", "startTime", "status"],
          include: [
            { model: Movie, attributes: ["id", "title"] },
            {
              model: Room,
              attributes: ["id", "name", "cinemaId"],
              include: [{ model: Cinema, attributes: ["id", "name"] }],
            },
          ],
        },
      ],
      raw: false,
    }),
    Seat.findAll({
      attributes: [
        "roomId",
        [sequelize.fn("COUNT", sequelize.col("id")), "totalSeats"],
      ],
      where: { isActive: true },
      group: ["roomId"],
      raw: true,
    }),
    Movie.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    }),
    Showtime.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("startTime")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "totalShowtimes"],
      ],
      where: { startTime: { [Op.between]: [from, to] } },
      group: [sequelize.fn("DATE", sequelize.col("startTime"))],
      order: [[sequelize.fn("DATE", sequelize.col("startTime")), "ASC"]],
      raw: true,
    }),
    Showtime.count({
      where: {
        status: "INACTIVE",
        startTime: { [Op.between]: [from, to] },
      },
    }),
    getRevenueOverview(),
  ]);

  const roomSeatMap = roomCapacityRows.reduce((acc, row) => {
    acc[row.roomId] = Number(row.totalSeats || 0);
    return acc;
  }, {});

  const paidInRange = paymentRows.filter((payment) => {
    const paidAt = payment.paidAt ? new Date(payment.paidAt).getTime() : 0;
    return paidAt >= from.getTime() && paidAt <= to.getTime();
  });

  const revenueByMovie = {};
  const revenueByCinema = {};
  const revenueByRoom = {};
  const revenueByTimeSlot = {
    goldenHour: 0,
    offPeak: 0,
  };

  for (const payment of paidInRange) {
    const amount = Number(payment.amount || 0);
    const showtime = payment.Booking?.Showtime;
    const movie = showtime?.Movie;
    const room = showtime?.Room;
    const cinema = room?.Cinema;

    if (movie) {
      revenueByMovie[movie.id] = revenueByMovie[movie.id] || {
        movieId: movie.id,
        movieTitle: movie.title,
        revenue: 0,
      };
      revenueByMovie[movie.id].revenue += amount;
    }

    if (cinema) {
      revenueByCinema[cinema.id] = revenueByCinema[cinema.id] || {
        cinemaId: cinema.id,
        cinemaName: cinema.name,
        revenue: 0,
      };
      revenueByCinema[cinema.id].revenue += amount;
    }

    if (room) {
      revenueByRoom[room.id] = revenueByRoom[room.id] || {
        roomId: room.id,
        roomName: room.name,
        cinemaId: room.cinemaId,
        cinemaName: cinema?.name || null,
        revenue: 0,
      };
      revenueByRoom[room.id].revenue += amount;
    }

    const hour = dayjs(showtime?.startTime).hour();
    if (hour >= GOLDEN_HOUR_START && hour < GOLDEN_HOUR_END) {
      revenueByTimeSlot.goldenHour += amount;
    } else {
      revenueByTimeSlot.offPeak += amount;
    }
  }

  const seatStatsByShowtime = {};
  const ticketViewByMovie = {};
  let totalTicketsSold = 0;
  let canceledTickets = 0;

  for (const reservation of reservationRows) {
    const showtime = reservation.Showtime;
    if (!showtime) {
      continue;
    }

    if (!seatStatsByShowtime[showtime.id]) {
      seatStatsByShowtime[showtime.id] = {
        showtimeId: showtime.id,
        startTime: showtime.startTime,
        roomId: showtime.roomId,
        roomName: showtime.Room?.name || null,
        movieId: showtime.movieId,
        movieTitle: showtime.Movie?.title || null,
        cinemaId: showtime.Room?.Cinema?.id || null,
        cinemaName: showtime.Room?.Cinema?.name || null,
        bookedSeats: 0,
        canceledSeats: 0,
      };
    }

    if (reservation.status === "BOOKED") {
      totalTicketsSold += 1;
      seatStatsByShowtime[showtime.id].bookedSeats += 1;

      if (showtime.Movie) {
        ticketViewByMovie[showtime.Movie.id] = ticketViewByMovie[
          showtime.Movie.id
        ] || {
          movieId: showtime.Movie.id,
          movieTitle: showtime.Movie.title,
          viewerCount: 0,
        };
        ticketViewByMovie[showtime.Movie.id].viewerCount += 1;
      }
    }

    if (reservation.status === "CANCELED") {
      canceledTickets += 1;
      seatStatsByShowtime[showtime.id].canceledSeats += 1;
    }
  }

  const showtimeStats = Object.values(seatStatsByShowtime);
  const showtimeCount = showtimeStats.length;
  const totalBookedSeats = sumBy(showtimeStats, "bookedSeats");
  const totalSeatsAvailable = showtimeStats.reduce(
    (sum, item) => sum + Number(roomSeatMap[item.roomId] || 0),
    0,
  );

  const occupancyRate =
    totalSeatsAvailable > 0
      ? Number(((totalBookedSeats / totalSeatsAvailable) * 100).toFixed(2))
      : 0;

  const averageTicketsPerShowtime =
    showtimeCount > 0
      ? Number((totalBookedSeats / showtimeCount).toFixed(2))
      : 0;

  const mostCrowdedShowtime =
    showtimeStats.slice().sort((a, b) => b.bookedSeats - a.bookedSeats)[0] ||
    null;

  const topMoviesByRevenue = Object.values(revenueByMovie)
    .map((item) => ({ ...item, revenue: Number(item.revenue.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const leastViewedMovie =
    Object.values(ticketViewByMovie).sort(
      (a, b) => a.viewerCount - b.viewerCount,
    )[0] || null;

  const movieStatus = movieStatusRows.reduce(
    (acc, row) => {
      if (row.status === "NOW_SHOWING") {
        acc.nowShowing = Number(row.count || 0);
      }
      if (row.status === "COMING_SOON") {
        acc.comingSoon = Number(row.count || 0);
      }
      return acc;
    },
    { nowShowing: 0, comingSoon: 0 },
  );

  return res.json({
    data: {
      filters: {
        dateFrom: dayjs(from).format("YYYY-MM-DD"),
        dateTo: dayjs(to).format("YYYY-MM-DD"),
      },
      business: {
        revenue: {
          total: revenueOverview,
          byMovie: topMoviesByRevenue,
          byCinema: Object.values(revenueByCinema).sort(
            (a, b) => b.revenue - a.revenue,
          ),
          byRoom: Object.values(revenueByRoom).sort(
            (a, b) => b.revenue - a.revenue,
          ),
          byTimeSlot: {
            goldenHour: Number(revenueByTimeSlot.goldenHour.toFixed(2)),
            offPeak: Number(revenueByTimeSlot.offPeak.toFixed(2)),
          },
        },
        tickets: {
          totalSold: totalTicketsSold,
          seatOccupancyRate: occupancyRate,
          averageTicketsPerShowtime,
          canceledTickets,
        },
      },
      movies: {
        nowShowingCount: movieStatus.nowShowing,
        comingSoonCount: movieStatus.comingSoon,
        bestSellingByRevenue: topMoviesByRevenue,
        leastViewedMovie,
      },
      showtimes: {
        totalPerDay: dailyShowtimeRows.map((row) => ({
          date: row.date,
          totalShowtimes: Number(row.totalShowtimes || 0),
        })),
        mostCrowdedShowtime,
        canceledShowtimes: canceledShowtimeCount,
      },
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
