const { Op } = require("sequelize");
const dayjs = require("dayjs");
const QRCode = require("qrcode");
const {
  sequelize,
  User,
  Movie,
  Cinema,
  Room,
  Seat,
  Showtime,
  Booking,
  Snack,
  SeatReservation,
  Payment,
  BookingSnack,
  Ticket,
} = require("../models");
const ApiError = require("../utils/apiError");
const { validateUrl } = require("../utils/urlValidator");
const { cancelBooking } = require("../services/bookingService");
const { generateBookingCode, generateTicketCode } = require("../utils/bookingCode");
const { calculateSeatPrice } = require("../utils/seatPricing");

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

  // Validate URLs from user input
  if (payload.posterUrl && !validateUrl(payload.posterUrl)) {
    throw new ApiError(400, "posterUrl không hợp lệ (phải là HTTP/HTTPS URL).");
  }
  if (payload.trailerUrl && !validateUrl(payload.trailerUrl)) {
    throw new ApiError(400, "trailerUrl không hợp lệ (phải là HTTP/HTTPS URL).");
  }

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

  // Validate URLs from user input
  if (req.body.posterUrl && !validateUrl(req.body.posterUrl)) {
    throw new ApiError(400, "posterUrl không hợp lệ (phải là HTTP/HTTPS URL).");
  }
  if (req.body.trailerUrl && !validateUrl(req.body.trailerUrl)) {
    throw new ApiError(400, "trailerUrl không hợp lệ (phải là HTTP/HTTPS URL).");
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
    include: [{ model: Room, include: [{ model: Seat }] }],
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

  console.log('Received seats:', JSON.stringify(seats, null, 2));

  await sequelize.transaction(async (transaction) => {
    // Xóa ghế cũ
    await Seat.destroy({ where: { roomId: room.id }, transaction });
    
    // Tạo ghế mới
    const createdSeats = await Seat.bulkCreate(
      seats.map((item) => ({
        roomId: room.id,
        rowLabel: item.rowLabel,
        seatNumber: item.seatNumber,
        type: item.type || "SINGLE",
        price: item.price != null ? item.price : null,
        isActive: item.isActive !== false,
      })),
      { transaction },
    );

    // Cập nhật lại rowCount và colCount của Room dựa trên sơ đồ mới
    const uniqueRows = new Set(seats.map(s => s.rowLabel));
    const maxCols = seats.reduce((max, s) => Math.max(max, s.seatNumber), 0);
    
    await room.update({
      rowCount: uniqueRows.size,
      colCount: maxCols
    }, { transaction });

    console.log(`Updated room ${room.id} dimensions: ${uniqueRows.size} rows, ${maxCols} cols`);
  });

  return res.json({ message: "Seats configured successfully." });
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
    include: [Movie, { model: Room, include: [Cinema] }],
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
  const row = await Booking.findByPk(req.params.id, {
    include: [{ model: Showtime, include: [Movie, Room] }, { model: Ticket }],
  });
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

    // Tạo vé nếu chưa có
    if (!row.Ticket) {
      const ticketCode = generateTicketCode();
      const qrPayload = {
        ticketCode,
        bookingCode: row.code,
        movie: row.Showtime?.Movie?.title,
        showtime: row.Showtime?.startTime,
        room: row.Showtime?.Room?.name,
      };
      const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrPayload));

      await Ticket.create({
        bookingId: row.id,
        ticketCode,
        qrCodeData,
        status: "VALID",
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

const createDirectBooking = async (req, res) => {
  const {
    userId,
    customerInfo,
    showtimeId,
    seatIds,
    paymentStatus, // 'PAID' or 'PENDING'
    paymentMethod, // 'CASH', 'MOMO', 'CARD', etc.
    snacks = [],
  } = req.body;

  if (!showtimeId || !seatIds || seatIds.length === 0) {
    throw new ApiError(400, "Thông tin suất chiếu và ghế là bắt buộc.");
  }

  return await sequelize.transaction(async (transaction) => {
    let finalUserId = userId;
    
    // Logic xác định trạng thái dựa trên phương thức thanh toán
    // Tiền mặt (CASH) -> CONFIRMED/PAID ngay lập tức
    // MoMo/Thẻ (MOMO/CARD) -> HOLD/PENDING (chờ chuyển khoản xong admin mới confirm)
    const isInstantPayment = paymentMethod === "CASH";
    const bookingStatus = isInstantPayment ? "CONFIRMED" : "HOLD";
    const pStatus = isInstantPayment ? "PAID" : "PENDING";

    // Nếu không có userId, kiểm tra hoặc tạo user mới từ customerInfo
    if (!finalUserId && customerInfo) {
      const [user] = await User.findOrCreate({
        where: { email: customerInfo.email },
        defaults: {
          fullName: customerInfo.fullName,
          phone: customerInfo.phone,
          passwordHash: "DIRECT_BOOKING_GUEST", // Mật khẩu giả cho khách đặt tại quầy
          role: "USER",
        },
        transaction,
      });
      finalUserId = user.id;
    }

    if (!finalUserId) {
      throw new ApiError(400, "Thông tin khách hàng là bắt buộc.");
    }

    const showtime = await Showtime.findByPk(showtimeId, {
      include: [{ model: Room }, { model: Movie }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!showtime) {
      throw new ApiError(404, "Không tìm thấy lịch chiếu.");
    }

    if (dayjs(showtime.startTime).isBefore(dayjs())) {
      throw new ApiError(400, "Không thể đặt vé cho suất chiếu đã bắt đầu.");
    }

    const seats = await Seat.findAll({
      where: {
        id: seatIds,
        roomId: showtime.roomId,
        isActive: true,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (seats.length !== seatIds.length) {
      throw new ApiError(400, "Một số ghế không hợp lệ trong phòng này.");
    }

    const now = new Date();
    const conflicts = await SeatReservation.findAll({
      where: {
        showtimeId,
        seatId: seatIds,
        [Op.or]: [
          { status: "BOOKED" },
          {
            status: "HELD",
            expiresAt: { [Op.gt]: now },
          },
        ],
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (conflicts.length > 0) {
      throw new ApiError(409, "Một số ghế đã được đặt trước.");
    }

    const booking = await Booking.create(
      {
        userId: finalUserId,
        showtimeId,
        code: generateBookingCode(),
        status: bookingStatus,
        paymentStatus: pStatus,
        expiresAt: isInstantPayment ? null : dayjs().add(30, "minute").toDate(),
      },
      { transaction },
    );

    let total = 0;

    for (const seat of seats) {
      const seatPrice = calculateSeatPrice(showtime.basePrice, seat.type, seat.price);
      total += seatPrice;
      
      await SeatReservation.create(
        {
          showtimeId,
          seatId: seat.id,
          bookingId: booking.id,
          status: isInstantPayment ? "BOOKED" : "HELD",
          expiresAt: isInstantPayment ? null : booking.expiresAt,
          price: seatPrice,
        },
        { transaction },
      );
    }

    if (snacks.length > 0) {
      const snackIds = snacks.map((item) => item.snackId);
      const snackRows = await Snack.findAll({
        where: { id: snackIds, isActive: true },
        transaction,
      });

      for (const item of snacks) {
        const snack = snackRows.find((s) => s.id === item.snackId);
        if (snack) {
          const quantity = Number(item.quantity || 1);
          const snackPrice = Number(snack.price) * quantity;
          total += snackPrice;

          await BookingSnack.create(
            {
              bookingId: booking.id,
              snackId: snack.id,
              quantity,
              price: snack.price,
            },
            { transaction },
          );
        }
      }
    }

    booking.totalAmount = total;
    await booking.save({ transaction });

    if (isInstantPayment) {
      await Payment.create({
        bookingId: booking.id,
        method: paymentMethod || "CASH",
        status: "SUCCESS",
        transactionRef: `DIRECT-CASH-${Date.now()}`,
        paidAt: new Date(),
        amount: total,
      }, { transaction });

      // Tạo vé cho các booking đã xác nhận ngay
      const ticketCode = generateTicketCode();
      const qrPayload = {
        ticketCode,
        bookingCode: booking.code,
        movie: showtime.Movie?.title,
        showtime: showtime.startTime,
        room: showtime.Room?.name,
      };
      const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrPayload));
      
      await Ticket.create({
        bookingId: booking.id,
        ticketCode,
        qrCodeData,
        status: "VALID",
      }, { transaction });
    }

    return res.status(201).json({ message: "Booking created successfully.", data: booking });
  });
};

const markAsPaidAdmin = async (req, res) => {
  const row = await Booking.findByPk(req.params.id, {
    include: [{ model: Showtime, include: [Movie, Room] }, { model: Ticket }],
  });
  if (!row) {
    throw new ApiError(404, "Booking not found.");
  }

  if (row.paymentStatus === "PAID" && row.Ticket) {
    return res.json({ message: "Booking is already paid.", data: row });
  }

  row.paymentStatus = "PAID";
  await row.save();

  // Create payment record if not exists
  const exists = await Payment.findOne({ where: { bookingId: row.id } });
  if (!exists) {
    await Payment.create({
      bookingId: row.id,
      method: req.body.method || "ADMIN",
      status: "SUCCESS",
      transactionRef: `PAID-ADMIN-${Date.now()}`,
      paidAt: new Date(),
      amount: row.totalAmount,
    });
  }

  // Tạo vé nếu chưa có
  if (!row.Ticket) {
    const ticketCode = generateTicketCode();
    const qrPayload = {
      ticketCode,
      bookingCode: row.code,
      movie: row.Showtime?.Movie?.title,
      showtime: row.Showtime?.startTime,
      room: row.Showtime?.Room?.name,
    };
    const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrPayload));

    await Ticket.create({
      bookingId: row.id,
      ticketCode,
      qrCodeData,
      status: "VALID",
    });
  }

  return res.json({ message: "Booking marked as paid.", data: row });
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

const getRevenueOverview = async (movieId = null) => {
  const whereBase = { status: "SUCCESS" };
  const include = [];

  if (movieId) {
    include.push({
      model: Booking,
      required: true,
      include: [
        {
          model: Showtime,
          required: true,
          where: { movieId },
        },
      ],
    });
  }

  const [todayRevenueRows, weekRevenueRows, monthRevenueRows] =
    await Promise.all([
      Payment.findAll({
        where: {
          ...whereBase,
          paidAt: { [Op.gte]: dayjs().startOf("day").toDate() },
        },
        include,
        attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total"]],
        raw: true,
      }),
      Payment.findAll({
        where: {
          ...whereBase,
          paidAt: { [Op.gte]: dayjs().startOf("week").toDate() },
        },
        include,
        attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total"]],
        raw: true,
      }),
      Payment.findAll({
        where: {
          ...whereBase,
          paidAt: { [Op.gte]: dayjs().startOf("month").toDate() },
        },
        include,
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
  const movieId = req.query.movieId ? Number(req.query.movieId) : null;

  const paymentWhere = {
    status: "SUCCESS",
    paidAt: { [Op.between]: [from, to] },
  };
  const paymentInclude = [
    {
      model: Booking,
      attributes: ["id", "showtimeId"],
      include: [
        {
          model: Showtime,
          attributes: ["id", "movieId", "roomId", "startTime"],
          where: movieId ? { movieId } : {},
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
  ];

  const reservationWhere = {
    createdAt: { [Op.between]: [from, to] },
  };
  const reservationInclude = [
    {
      model: Showtime,
      attributes: ["id", "movieId", "roomId", "startTime", "status"],
      where: movieId ? { movieId } : {},
      include: [
        { model: Movie, attributes: ["id", "title"] },
        {
          model: Room,
          attributes: ["id", "name", "cinemaId"],
          include: [{ model: Cinema, attributes: ["id", "name"] }],
        },
      ],
    },
  ];

  const showtimeWhere = { startTime: { [Op.between]: [from, to] } };
  if (movieId) {
    showtimeWhere.movieId = movieId;
  }

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
      where: paymentWhere,
      include: paymentInclude,
      raw: false,
    }),
    SeatReservation.findAll({
      where: reservationWhere,
      include: reservationInclude,
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
      where: movieId ? { id: movieId } : {},
      group: ["status"],
      raw: true,
    }),
    Showtime.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("startTime")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "totalShowtimes"],
      ],
      where: showtimeWhere,
      group: [sequelize.fn("DATE", sequelize.col("startTime"))],
      order: [[sequelize.fn("DATE", sequelize.col("startTime")), "ASC"]],
      raw: true,
    }),
    Showtime.count({
      where: {
        ...showtimeWhere,
        status: "INACTIVE",
      },
    }),
    getRevenueOverview(movieId),
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
        ticketCount: 0,
        canceledSeats: 0,
      };
    }

    if (reservation.status === "BOOKED") {
      totalTicketsSold += 1;
      seatStatsByShowtime[showtime.id].bookedSeats += 1;
      seatStatsByShowtime[showtime.id].ticketCount += 1;

      if (showtime.Movie) {
        ticketViewByMovie[showtime.Movie.id] = ticketViewByMovie[
          showtime.Movie.id
        ] || {
          movieId: showtime.Movie.id,
          movieTitle: showtime.Movie.title,
          viewerCount: 0,
          ticketCount: 0,
        };
        ticketViewByMovie[showtime.Movie.id].viewerCount += 1;
        ticketViewByMovie[showtime.Movie.id].ticketCount += 1;
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
    showtimeStats
      .filter((s) => s.bookedSeats > 0)
      .sort((a, b) => b.bookedSeats - a.bookedSeats)[0] || null;

  const topMoviesByRevenue = Object.values(revenueByMovie)
    .map((item) => ({ ...item, revenue: Number(item.revenue.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const leastViewedMovie =
    Object.values(ticketViewByMovie)
      .filter((m) => m.viewerCount > 0)
      .sort((a, b) => a.viewerCount - b.viewerCount)[0] || null;

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

const deleteCinema = async (req, res) => {
  const row = await Cinema.findByPk(req.params.id);
  if (!row) {
    throw new ApiError(404, "Cinema not found.");
  }
  await row.destroy();
  return res.json({ message: "Cinema deleted." });
};

const deleteRoom = async (req, res) => {
  const row = await Room.findByPk(req.params.id);
  if (!row) {
    throw new ApiError(404, "Room not found.");
  }
  await row.destroy();
  return res.json({ message: "Room deleted." });
};

const deleteBooking = async (req, res) => {
  const row = await Booking.findByPk(req.params.id);
  if (!row) {
    throw new ApiError(404, "Booking not found.");
  }

  await sequelize.transaction(async (transaction) => {
    // Thủ công xóa các bản ghi liên quan để đảm bảo hoạt động trên mọi DB cấu hình
    await SeatReservation.destroy({ where: { bookingId: row.id }, transaction });
    await BookingSnack.destroy({ where: { bookingId: row.id }, transaction });
    await Payment.destroy({ where: { bookingId: row.id }, transaction });
    await Ticket.destroy({ where: { bookingId: row.id }, transaction });
    
    await row.destroy({ transaction });
  });

  return res.json({ message: "Booking deleted." });
};

const verifyTicket = async (req, res) => {
  const { ticketCode } = req.params;

  const ticket = await Ticket.findOne({
    where: { ticketCode },
    include: [
      {
        model: Booking,
        include: [
          { model: User, attributes: ["fullName", "email", "phone"] },
          {
            model: Showtime,
            include: [
              { model: Movie, attributes: ["title", "posterUrl"] },
              { model: Room, include: [Cinema] },
            ],
          },
          { model: SeatReservation, include: [Seat] },
          { model: BookingSnack, include: [Snack] },
        ],
      },
    ],
  });

  if (!ticket) {
    throw new ApiError(404, "Không tìm thấy vé hợp lệ.");
  }

  return res.json({ data: ticket });
};

const useTicket = async (req, res) => {
  const { ticketCode } = req.params;

  const ticket = await Ticket.findOne({ where: { ticketCode } });

  if (!ticket) {
    throw new ApiError(404, "Không tìm thấy vé.");
  }

  if (ticket.status === "USED") {
    throw new ApiError(400, "Vé này đã được sử dụng trước đó.");
  }

  if (ticket.status === "CANCELED") {
    throw new ApiError(400, "Vé này đã bị hủy.");
  }

  ticket.status = "USED";
  await ticket.save();

  return res.json({ message: "Xác nhận check-in thành công.", data: ticket });
};

const updateCinema = async (req, res) => {
  const row = await Cinema.findByPk(req.params.id);
  if (!row) {
    throw new ApiError(404, "Cinema not found.");
  }
  Object.assign(row, req.body);
  await row.save();
  return res.json({ message: "Cinema updated.", data: row });
};

const updateRoom = async (req, res) => {
  const row = await Room.findByPk(req.params.id);
  if (!row) {
    throw new ApiError(404, "Room not found.");
  }
  // Chỉ cập nhật tên, không cập nhật cinemaId/rowCount/colCount để tránh hỏng sơ đồ ghế
  if (req.body.name) {
    row.name = req.body.name;
  }
  await row.save();
  return res.json({ message: "Room updated.", data: row });
};

module.exports = {
  listUsers,
  lockUser,
  createMovie,
  updateMovie,
  deleteMovie,
  listMoviesAdmin,
  createCinema,
  updateCinema,
  listCinemas,
  createRoom,
  updateRoom,
  listRooms,
  configureSeats,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  listShowtimesAdmin,
  listBookingsAdmin,
  confirmBookingAdmin,
  cancelBookingAdmin,
  createDirectBooking,
  markAsPaidAdmin,
  dashboard,
  deleteCinema,
  deleteRoom,
  deleteBooking,
  verifyTicket,
  useTicket,
};
